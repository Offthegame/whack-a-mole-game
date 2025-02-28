import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
console.log(process.env.NODE_ENV);

// ✅ CORS 설정
const allowedOrigins = [
  "http://localhost:3000",
  "https://wincross-whackamole.netlify.app",
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS 정책에 의해 차단됨"));
    }
  },
};

app.use(cors(corsOptions));
app.use(express.json());

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
  name: String,
  password: String,
  gameTime: Number,
  randomizeQuestions: Boolean,
  milariSaid: String,
  questions: Array
});

const Region = mongoose.model("Region", regionSchema);

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
        const filePath = path.join(regionsPath, file);
        const module = await import(`file://${filePath.replace(/\\/g, "/")}`);
        const regionData = module.default || module[regionId];

        if (regionData) {
          // ✅ 기존 데이터를 완전히 덮어쓰기
          await Region.replaceOne(
            { id: regionId },
            regionData,
            { upsert: true }
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

// ✅ 특정 지역 데이터 가져오기
app.get("/api/regions/:regionId", async (req, res) => {
  try {
    const region = await Region.findOne({ id: req.params.regionId });
    if (!region) return res.status(404).json({ error: "Region not found" });
    res.json(region);
  } catch (error) {
    console.error("🚨 지역 데이터 불러오기 실패:", error);
    res.status(500).json({ error: "Failed to fetch region data" });
  }
});

// ✅ 지역 데이터 업데이트 API
app.post("/api/update-region", async (req, res) => {
  const { id, name, password, gameTime, randomizeQuestions, milariSaid, questions } = req.body;

  try {
    const updatedRegion = await Region.findOneAndUpdate(
      { id },
      { name, password, gameTime, randomizeQuestions, milariSaid, questions },
      { new: true, upsert: true }
    );
    
    res.json({ success: true, data: updatedRegion });
  } catch (error) {
    console.error("🚨 지역 데이터 업데이트 실패:", error);
    res.status(500).json({ success: false, message: "DB 업데이트 실패" });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));

app.get("/api/regions", async (req, res) => {
  try {
    const regions = await Region.find({});
    res.json(regions);
  } catch (error) {
    console.error("Failed to fetch regions:", error);
    res.status(500).json({ error: "Failed to fetch regions" });
  }
});