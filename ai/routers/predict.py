from fastapi import APIRouter, File, UploadFile, HTTPException
import librosa
import tempfile
import traceback
from services.model import snore_model

router = APIRouter()

@router.post("/predict")
async def predict(file: UploadFile = File(...)):

    try:
        print("파일명:", file.filename)
        print("content_type:", file.content_type)

        # 업로드 파일 읽기
        contents = await file.read()

        # 임시 파일 생성
        suffix = file.filename.split('.')[-1]

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=f".{suffix}"
        ) as tmp:

            tmp.write(contents)
            tmp_path = tmp.name

        print("임시파일:", tmp_path)

        # 오디오 로드
        audio, sr = librosa.load(
            tmp_path,
            sr=16000,
            mono=True
        )

        print("오디오 길이:", len(audio))
        print("샘플레이트:", sr)

        # 모델 예측
        result = snore_model.predict(audio)

        return {
            "success": True,
            "prediction": result
        }

    except Exception as e:
        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )