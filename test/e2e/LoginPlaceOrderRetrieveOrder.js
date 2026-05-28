import http from 'k6/http';
import  {check,sleep,group}  from 'k6';
import {Rate, Counter} from 'k6/metrics';

const authenticationRate = new Rate('authentication_rate');
const orderIdCounter = new Counter('order_id_counter');

export const options = {
stages : [
    { duration: '1s', target: 3 }, // Ramp up to 3 VUs over 1 second
    { duration: '2s', target: 3 }, // Stay at 3 VUs for 2 seconds
    { duration: '1s', target: 0 }, // Ramp down to 0 VUs over 1 second
],

    thresholds: {
        'http_req_duration': ['p(95)<100'], // 95% of requests should be below 100ms
        'http_req_failed': ['rate<0.01'], // Less than 1% of requests should fail
        'checks': ['rate>=1'], // Custom thresholds for checks
        'group_duration{group:::Login}': ['p(95)<1000'], // 95% of group durations should be below 200ms
        'group_duration{group:::Place Order}': ['p(95)<1200'], // 95% of group durations should be below 200ms
        'group_duration{group:::Retrieve Order}': ['p(95)<1000'], // 95% of group durations should be below 200ms
        'authentication_rate': ['rate>0.95'], // At least 95% of authentication attempts should succeed
        'order_id_counter': ['count>3'], // At least 1 order should be created
    },
};



export default  function () {
let authToken = null;
let userLoginCheck = false;
let orderCheck = false;
let retrieveCheck = false;
let orderId = null;
const BASE_URL = __ENV.BASE_URL ;
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
        orderCheck = check(orderResponse, {
            'place order api is status 200': (r) => r.status === 200,
            'order id returned': (r) => r.json('pizza.id') !== undefined,
        });

        if(orderCheck) {
            orderId = orderResponse.json('pizza.id');
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
        retrieveCheck = check(retrieveResponse, {
            'retrieve order api is status 200': (r) => r.status === 200,
            'correct order retrieved': (r) => r.json('id') === orderId,
        });
        if(retrieveCheck) {
            console.log('order retrieved succesfully:', retrieveResponse.json('id'));
        }
        sleep(0.5);
    }); // End of group
}