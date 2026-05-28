import http from 'k6/http';
import  {check,sleep,group}  from 'k6';
import {Rate, Counter} from 'k6/metrics';

const authenticationRate = new Rate('authentication_rate');
const orderIdCounter = new Counter('order_id_counter');
const testConfig = JSON.parse(open('test-config.json'));

function getTestConfigValue() {
    const testType = __ENV.TEST_TYPE || 'smoke';
    return (testConfig[testType] && testConfig[testType].options) || {};
}

export const options = {
    stages : getTestConfigValue().stages,
    thresholds: getTestConfigValue().thresholds,
};



export default  function () {
let authToken = null;
let userLoginCheck = false;
let orderCheck = false;
let retrieveCheck = false;
let orderId = null;
const BASE_URL = (__ENV.BASE_URL || 'https://quickpizza.grafana.com/api/').replace(/\/?$/, '/');
console.log('BASE_URL from env:', __ENV.BASE_URL || '(not set)');
console.log('Testing against BASE_URL:', BASE_URL);

    group('Login', function() {  
        const url = `${BASE_URL}users/token/login`;
        const payload = JSON.stringify(
            { username: 'default', 
            password: '12345678' 
            });
        const params = {
            headers: { 'Content-Type': 'application/json' }
        };       
        const loginResponse = http.post(url,payload,params);

        let loginJson = null;
        if (loginResponse && loginResponse.body) {
            try {
                loginJson = loginResponse.json();
            } catch (e) {
                loginJson = null;
            }
        }

         userLoginCheck = check(loginResponse, {
            'is status 200': (r) => r.status === 200,
            'token returned': () => loginJson !== null && loginJson.token !== undefined,
        });
        if (userLoginCheck) {
            authToken = loginJson.token;
            authenticationRate.add(true);
        } else {
            authenticationRate.add(false);
            console.log('token:', authToken);
        }
        
        sleep(0.5);
    }); // End of group

    group('Place Order', function() {
        const orderUrl = `${BASE_URL}pizza`;
        const orderPayload = JSON.stringify({
            customName: "default",
            excludedIngredients: [],
            excludedTools: [],
            maxCaloriesPerSlice: 1000,
            maxNumberOfToppings: 5,
            minNumberOfToppings: 2,
            mustBeVegetarian: false
        });
        const orderParams = {
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        };
        const orderResponse = http.post(orderUrl, orderPayload, orderParams);
        let orderJson = null;
        if (orderResponse && orderResponse.body) {
            try {
                orderJson = orderResponse.json();
            } catch (e) {
                orderJson = null;
            }
        }
        orderCheck = check(orderResponse, {
            'place order api is status 200': (r) => r.status === 200,
            'order id returned': () => orderJson !== null && orderJson.pizza && orderJson.pizza.id !== undefined,
        });

        if(orderCheck) {
            orderId = orderJson.pizza.id;
            orderIdCounter.add(1);
            console.log('order id:', orderId);
        }
        sleep(1);
    }); // End of group

    group('Retrieve Order', function() {
        const retrieveUrl = `${BASE_URL}pizza/${orderId}`;
        const retrieveParams = {
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${authToken}`
            }
        };
        const retrieveResponse = http.get(retrieveUrl, retrieveParams);
        let retrieveJson = null;
        if (retrieveResponse && retrieveResponse.body) {
            try {
                retrieveJson = retrieveResponse.json();
            } catch (e) {
                retrieveJson = null;
            }
        }
        retrieveCheck = check(retrieveResponse, {
            'retrieve order api is status 200': (r) => r.status === 200,
            'correct order retrieved': () => retrieveJson !== null && retrieveJson.id === orderId,
        });
        if(retrieveCheck) {
            console.log('order retrieved succesfully:', retrieveJson.id);
        }
        sleep(0.5);
    }); // End of group
}