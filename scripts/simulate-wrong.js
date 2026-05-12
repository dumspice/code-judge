const axios = require('axios');

async function simulateWrongAnswer() {
  const submissionData = {
    problemId: "95c4b03d-8913-44f8-873e-0fa265392ce1", // ID bài toán tổng 2 số
    language: "PYTHON",
    mode: "ALGO",
    // Code sai: cộng thêm 2 vào tổng
    sourceCode: "a, b = map(int, input().split())\nprint(a + b + 2)",
    userId: "e729209b-400f-4b3a-bb3c-81ca4787df00"
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
