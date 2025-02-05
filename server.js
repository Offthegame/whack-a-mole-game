import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000; // Render에서 자동 할당된 포트 사용

// 환경에 따라 허용할 Origin 결정 (개발환경: localhost, 배포환경: 실제 도메인)
const allowedOrigin =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://wincross-whackamole.netlify.app";

// CORS 옵션 설정
const corsOptions = {
  origin: allowedOrigin,
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type, Authorization",
};

app.use(cors(corsOptions)); // 하나의 CORS 미들웨어만 적용

// ✅ ES 모듈에서 __dirname 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const regionsPath = path.join(__dirname, "regions");

// ✅ MongoDB 연결
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB 연결 성공!"))
  .catch(err => console.error("❌ MongoDB 연결 실패:", err));

// ✅ 지역 데이터 Schema
const regionSchema = new mongoose.Schema({
  id: String,
  gameTime: Number,
  randomizeQuestions: Boolean,
  levels: Object,
});

const Region = mongoose.model("Region", regionSchema);

app.use(express.json());

// ✅ 기본 페이지 라우팅
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ 서버 시작 시 기존 `regions/` 폴더 내 파일을 MongoDB로 자동 업로드
const initializeRegions = async () => {
  console.log("🔍 `regions/` 폴더 내 기존 파일을 MongoDB로 업로드 중...");

  if (!fs.existsSync(regionsPath)) {
    console.warn("⚠️ `regions/` 폴더가 없음. 새로 생성 중...");
    fs.mkdirSync(regionsPath);
  }

  const files = fs.readdirSync(regionsPath);
  for (const file of files) {
    if (file.endsWith(".js")) {
      const regionId = file.replace(".js", "");
      console.log(`📂 파일 확인됨: ${file} -> ${regionId}`);

      try {
        // ✅ `import()`를 사용하여 파일 동적 로드
        const filePath = `file://${path.join(regionsPath, file)}`;
        const module = await import(filePath);
        const regionData = module.default || module[regionId];

        if (regionData) {
          await Region.findOneAndUpdate(
            { id: regionId },
            regionData,
            { upsert: true, new: true }
          );
          console.log(`✅ ${regionId} 데이터 MongoDB에 저장 완료.`);
        } else {
          console.warn(`⚠️ ${regionId} 데이터가 유효하지 않음.`);
        }
      } catch (error) {
        console.error(`❌ ${regionId} 데이터 변환 실패:`, error);
      }
    }
  }
};

initializeRegions();

// ✅ 특정 지역 데이터를 가져오기 (프론트엔드에서 호출)
app.get("/api/regions/:regionId", async (req, res) => {
  try {
    console.log(`📥 API 요청: ${req.params.regionId}`);
    const region = await Region.findOne({ id: req.params.regionId });
    if (!region) {
      console.log(`❌ ${req.params.regionId} 데이터 없음`);
      return res.status(404).json({ error: "Region not found" });
    }
    console.log(`✅ 데이터 응답: ${region.id}`);
    res.json(region);
  } catch (error) {
    console.error("🚨 지역 데이터 불러오기 실패:", error);
    res.status(500).json({ error: "Failed to fetch region data" });
  }
});

// ✅ 지역 데이터 저장 (프론트엔드에서 호출)
app.post("/save-region", async (req, res) => {
  try {
    const updatedRegion = await Region.findOneAndUpdate(
      { id: req.body.id },
      req.body,
      { new: true, upsert: true }
    );
    console.log(`✅ 지역 데이터 저장 완료: ${updatedRegion.id}`);
    res.json({ message: "Region data saved successfully", region: updatedRegion });
  } catch (error) {
    console.error("❌ 지역 데이터 저장 실패:", error);
    res.status(500).json({ error: "Failed to save region data" });
  }
});

// ✅ 기본 지역 데이터 가져오기 (region-001)
app.get("/default-region", async (req, res) => {
  try {
    const defaultRegion = await Region.findOne({ id: "region-001" });
    if (!defaultRegion) return res.status(404).json({ error: "Default region data not found" });
    res.json(defaultRegion);
  } catch (error) {
    console.error("❌ 기본 지역 데이터 로드 실패:", error);
    res.status(500).json({ error: "Failed to load default region data" });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
