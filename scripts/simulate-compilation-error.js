const axios = require('axios');

async function simulateCompilationError() {
  const submissionData = {
    problemId: "3b7ffcfd-2d7f-4a6f-92ec-524bc0e3ef13", // ID bài toán tổng 2 số
    language: "CPP",
    mode: "ALGO",
    // Code gây lỗi Compilation Error: viết sai câu lệnh
    sourceCode: `#include13213 <iostream>
usingr32r32 namespacezzz std;csfw
int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b << endl;
    return 0;
}`,
    userId: "4b17f4d4-1ffa-490a-8e67-7c331d9b9a5d"
  };

  try {
    console.log('🚀 Đang mô phỏng gửi code lỗi Compilation Error (Viết bừa)...');
    const response = await axios.post('http://localhost:3000/submissions', submissionData);
    console.log('✅ Thành công! Phản hồi từ API:', JSON.stringify(response.data, null, 2));
    console.log('\nĐợi 15 giây để worker xử lý...');
  } catch (error) {
    console.error('❌ Lỗi:', error.response ? error.response.data : error.message);
  }
}

simulateCompilationError();
