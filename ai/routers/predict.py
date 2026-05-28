from fastapi import APIRouter, File, UploadFile, HTTPException
import librosa
import tempfile
import traceback
import os
from services.model import snore_model

router = APIRouter()

@router.post("/predict")
async def predict(audio: UploadFile = File(...)):
    tmp_path = None
    try:
        # 업로드 파일 읽기
        contents = await audio.read()

        # 임시 파일 생성 및 쓰기
        suffix = audio.filename.split('.')[-1] if '.' in audio.filename else 'wav'
        
        # Windows 호환성을 위해 파일을 먼저 닫고 나중에 삭제하도록 처리
        fd, tmp_path = tempfile.mkstemp(suffix=f".{suffix}")
        try:
            with os.fdopen(fd, 'wb') as tmp:
                tmp.write(contents)
        except:
            if tmp_path and os.path.exists(tmp_path):
                os.unlink(tmp_path)
            raise

        try:
            # 오디오 로드 (sr=16000으로 리샘플링 포함)
            y, sr = librosa.load( 
                tmp_path,
                sr=16000,
                mono=True
            )
        except Exception as load_err:
            raise HTTPException(
                status_code=400,
                detail=f"오디오 파일을 로드할 수 없습니다: {str(load_err)}"
            )

        # 모델 예측
        result = snore_model.predict(y)

        return {
            "success": True,
            "prediction": result
        }

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail={
                "message": str(e),
                "traceback": traceback.format_exc()
            }
        )
    finally:
        # 임시 파일 삭제
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except:
                pass