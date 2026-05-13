const axios = require('axios');

async function simulateWrongAnswer() {
  const submissionData = {
    problemId: "3b7ffcfd-2d7f-4a6f-92ec-524bc0e3ef13", // ID bài toán tổng 2 số
    language: "PYTHON",
    mode: "ALGO",
    // Code sai: cộng thêm 2 vào tổng
    sourceCode: "a, b = map(int, input().split())\nprint(a + b + 2)",
    userId: "4b17f4d4-1ffa-490a-8e67-7c331d9b9a5d"
  };

  try {
    console.log('🚀 Đang mô phỏng gửi code SAI (a + b + 2)...');
    const response = await axios.post('http://localhost:3000/submissions', submissionData);
    console.log('✅ Thành công! Phản hồi từ API:', JSON.stringify(response.data, null, 2));
    console.log('\nĐợi 15 giây để worker xử lý...');
  } catch (error) {
    console.error('❌ Lỗi:', error.response ? error.response.data : error.message);
  }
}

simulateWrongAnswer();
