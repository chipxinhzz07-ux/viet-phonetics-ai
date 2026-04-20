const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(express.json());

// Khởi tạo Gemini với Key lấy từ biến môi trường của Vercel
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `Bạn là chuyên gia Ngữ âm học tiếng Việt (chuẩn Đoàn Thiện Thuật). 
Nhiệm vụ: 
1. Ra đề bài là các đoạn thơ/câu văn tiếng Việt theo độ khó: Dễ (từ đơn), Trung bình (thơ), Khó (câu phức).
2. Khi chấm điểm, phải so sánh bài làm của sinh viên với đáp án chuẩn IPA.
3. Giải thích lỗi sai dựa trên vị trí cấu âm và phương thức cấu âm.
Phản hồi LUÔN theo định dạng JSON: {"content": "đề bài", "answer": "phiên âm chuẩn", "hint": "giải thích"}`;

// API Lấy đề bài
app.post('/api/generate', async (req, res) => {
  try {
    const { level } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(`${SYSTEM_PROMPT}\nHãy tạo đề bài mức độ: ${level}`);
    const responseText = result.response.text().replace(/```json|```/g, "").trim();
    const response = JSON.parse(responseText);
    res.json(response);
  } catch (e) { 
    res.status(500).json({ error: "Lỗi AI không phản hồi" }); 
  }
});

// API Chấm điểm
app.post('/api/check', async (req, res) => {
  try {
    const { user_input, answer } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(`So sánh bài làm IPA: "${user_input}" với đáp án chuẩn: "${answer}". Hãy nhận xét lỗi sai ngữ âm một cách ngắn gọn.`);
    res.json({ feedback: result.response.text() });
  } catch (e) { 
    res.status(500).json({ error: "Lỗi chấm điểm" }); 
  }
});

// Xuất app để Vercel sử dụng (Thay vì dùng app.listen)
module.exports = app;
