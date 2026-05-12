const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API_URL = 'http://localhost:3000/submissions';
const USER_ID = 'e729209b-400f-4b3a-bb3c-81ca4787df00';
const PROBLEM_ID = '95c4b03d-8913-44f8-873e-0fa265392ce1';
const LANGUAGE = 'CPP';

// Sử dụng iostream để biên dịch nhanh hơn và tránh quá tải sandbox
const SOURCE_CODE = `#include <iostream>
using namespace std;

int main() {
    int a, b;
    if (cin >> a >> b) {
        cout << a + b << endl;
    }
    return 0;
}
`;

async function simulate() {
    console.log(`🚀 Đang mô phỏng gửi code TỐI GIẢN cho User: ${USER_ID}...`);
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: USER_ID,
                problemId: PROBLEM_ID,
                mode: 'ALGO',
                language: LANGUAGE,
                sourceCode: SOURCE_CODE
            }),
        });

        const data = await response.json();
        console.log('✅ Thành công! Phản hồi từ API:');
        console.log(JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('❌ Lỗi khi gửi submission:', error.message);
    }
}

simulate();
