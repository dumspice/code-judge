const axios = require('axios');

async function simulateRuntimeError() {
  const submissionData = {
    problemId: "95c4b03d-8913-44f8-873e-0fa265392ce1", // ID bài toán tổng 2 số
    language: "CPP",
    mode: "ALGO",
    // Code gây lỗi Runtime Error: Chia cho 0
    sourceCode: `#include <iostream>
using namespace std;
int main() {
    int a, b;
    cin >> a >> b;
    int x = 10 / (a - a); // Chia cho 0 (a - a = 0)
    cout << x << endl;
    return 0;
}`,
    userId: "e729209b-400f-4b3a-bb3c-81ca4787df00"
  };

  try {
    console.log('🚀 Đang mô phỏng gửi code lỗi Runtime Error (Chia cho 0)...');
    const response = await axios.post('http://localhost:3000/submissions', submissionData);
    console.log('✅ Thành công! Phản hồi từ API:', JSON.stringify(response.data, null, 2));
    console.log('\nĐợi 15 giây để worker xử lý...');
  } catch (error) {
    console.error('❌ Lỗi:', error.response ? error.response.data : error.message);
  }
}

simulateRuntimeError();
