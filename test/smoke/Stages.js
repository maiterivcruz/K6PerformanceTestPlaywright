import http from 'k6/http';
import  sleep  from 'k6';

export const options = {
   
stages : [
    { duration: '1s', target: 3 }, // Ramp up to 3 VUs over 1 second
    { duration: '8s', target: 3 }, // Stay at 3 VUs for 8 seconds
    { duration: '1s', target: 0 }, // Ramp down to 0 VUs over 1 second
],

    thresholds: {
        http_req_duration: ['p(95)<100'], // 95% of requests should be below 100ms
        http_req_failed: ['rate<0.01'], // Less than 1% of requests should fail
    },
};


export default  function () {
    http.get("https://quickpizza.grafana.com/")
    sleep(1);
}