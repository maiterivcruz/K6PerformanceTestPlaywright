import http from 'k6/http';
import  {check,sleep}  from 'k6';

export const options = {
   
stages : [
    { duration: '1s', target: 3 }, // Ramp up to 3 VUs over 1 second
    { duration: '8s', target: 3 }, // Stay at 3 VUs for 8 seconds
    { duration: '1s', target: 0 }, // Ramp down to 0 VUs over 1 second
],

    thresholds: {
        'http_req_duration': ['p(95)<100'], // 95% of requests should be below 100ms
        'http_req_failed': ['rate<0.01'], // Less than 1% of requests should fail
        'checks': ['rate>=1'], // Custom thresholds for checks
        'http_req_duration{name:get-pizza}': ['p(95)<100'], // 95% of requests should be below 100ms
        'http_req_failed{name:get-pizza}': ['rate<0.01'], // Less than 1% of requests should fail

    },
};


export default  function () {
    const response = http.get("https://quickpizza.grafana.com/");
    check(response, {
        'is status 200': (r) => r.status === 200,
        'payload is correct': (r) => r.body.includes('QuickPizza'),
    });
    http.get("https://quickpizza.grafana.com/api/pizza", 
        {
            tags: { name: 'get-pizza' }
        });
    sleep(1);
}