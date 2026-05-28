import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
    vus: 3,
    duration: '10s',

    thresholds: {
        http_req_duration: ['p(95)<100'], // 95% of requests should be below 100ms
        http_req_failed: ['rate<0.01'], // Less than 1% of requests should fail
    },
};


export default  function () {
    http.get("https://quickpizza.grafana.com/")
    sleep(1);
}