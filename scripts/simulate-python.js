const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API_URL = 'http://localhost:3000/submissions';
const USER_ID = 'e729209b-400f-4b3a-bb3c-81ca4787df00';
const PROBLEM_ID = '95c4b03d-8913-44f8-873e-0fa265392ce1';
const LANGUAGE = 'PYTHON'; // ID 71

const SOURCE_CODE = `
import sys
line = sys.stdin.readline()
if line:
    a, b = map(int, line.split())
    print(a + b)
`;

async function simulate() {
    console.log(`🚀 Đang mô phỏng gửi code PYTHON cho User: ${USER_ID}...`);
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: USER_ID,
                problemId: PROBLEM_ID,
                mode: 'ALGO',
                language: 'PYTHON', // Core-api will map this
                sourceCode: SOURCE_CODE
            }),
        });

        const data = await response.json();
        console.log('✅ Thành công! Phản hồi từ API:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
    }
}

simulate();
