const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API_URL = 'http://localhost:3000/submissions';
const USER_ID = '4b17f4d4-1ffa-490a-8e67-7c331d9b9a5d';
const PROBLEM_ID = '3b7ffcfd-2d7f-4a6f-92ec-524bc0e3ef13';
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
