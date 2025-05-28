from fastapi import FastAPI, File, UploadFile, HTTPException, Form, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
import numpy as np
import cv2
import time
import uuid
import tempfile
from datetime import datetime
import os
import io
import shutil
import torch
from PIL import Image
import logging
from ultralytics import YOLO


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()]
)

# Create FastAPI app
app = FastAPI(
    title="Weapon Detection API",
    description="API for weapon detection using YOLOv8",
    version="1.0.0"
)

# Add CORS middleware for NextJS integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
MODEL_PATH = os.environ.get("MODEL_PATH", r"E:\ML\Weapon Detection System\weapon-detection-system\backend\best.pt")
UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "uploads")
DETECTION_HISTORY = []
# Ensure upload directory exists
# os.makedirs(UPLOAD_DIR, exist_ok=True)
# Pydantic models for request/response validation
class DetectionResult(BaseModel):
    id: str
    timestamp: str
    source_type: str
    weapon_count: int
    confidence_scores: List[float] = ()
    processing_time: float
    image_path: Optional[str] = None
    class_names: List[str] = ()

class DetectionRequest(BaseModel):
    conf_threshold: float = 0.25

class VideoDetectionRequest(BaseModel):
    conf_threshold: float = 0.25
    frame_skip: int = 2

class HistoryDeleteRequest(BaseModel):
    id: str

# Load the PyTorch model
model = None

def get_model():
    global model
    if model is None:
        try:
            # Load YOLOv8 model using ultralytics
            logging.info(f"Loading model from {MODEL_PATH}")
            model = YOLO(MODEL_PATH)
            logging.info("Model loaded successfully")
        except Exception as e:
            logging.error(f"Failed to load model: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to load model: {str(e)}")
    return model


# Resize image to square
def resize_image_to_square(img, target_size=(640, 640)):
    # Convert to RGB if grayscale
    if len(img.shape) == 2:
        img = cv2.cvtColor(img, cv2.COLOR_GRAY2RGB)
    elif img.shape[2] == 4:  # RGBA
        img = cv2.cvtColor(img, cv2.COLOR_RGBA2RGB)

    # Directly resize to target size
    resized_img = cv2.resize(img, target_size, interpolation=cv2.INTER_LINEAR)

    return resized_img


# Detection function for images
def detect_weapons(model, img, conf_threshold=0.25, input_size=(640, 640)):
    # Track time
    start_time = time.time()

    # Resize image to expected input size
    resized_img = resize_image_to_square(img, input_size)

    try:
        # Run inference with YOLOv8
        results = model(resized_img, conf=conf_threshold)

        # Process results
        detections = []
        confidence_scores = []
        class_names = []

        # Extract detection results
        for result in results:
            boxes = result.boxes

            # Process each detection
            for i, box in enumerate(boxes):
                # Get box coordinates (in xyxy format)
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()

                # Get confidence
                conf = float(box.conf[0].cpu().numpy())
                confidence_scores.append(conf)

                # Get class ID and name
                cls_id = int(box.cls[0].cpu().numpy())
                class_name = model.names[cls_id]
                class_names.append(class_name)

                # Format: [x1, y1, x2, y2, score, class_id]
                detections.append([int(x1), int(y1), int(x2), int(y2), conf, cls_id])

        proc_time = time.time() - start_time
        return detections, confidence_scores, class_names, proc_time

    except Exception as e:
        logging.error(f"Inference error: {e}")
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")


# Draw bounding boxes on image
def draw_detections(img, detections, class_names=None):
    # Default colors
    colors = {
        0: (0, 0, 255),  # Red for weapon
        1: (0, 255, 0),  # Green for other classes
    }

    result_img = img.copy()

    for box in detections:
        x1, y1, x2, y2, score, class_id = box

        # Get label
        if class_names and class_id in class_names:
            label = f"{class_names[class_id]} {score:.2f}"
        else:
            label = f"Class {class_id} {score:.2f}"

        # Set color
        color = colors.get(class_id, (128, 128, 128))  # Default to gray

        # Draw rectangle
        cv2.rectangle(result_img, (x1, y1), (x2, y2), color, 2)

        # Draw label background
        text_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.7, 2)[0]
        cv2.rectangle(result_img, (x1, y1 - 25), (x1 + text_size[0] + 10, y1), color, -1)

        # Draw label text
        cv2.putText(result_img, label, (x1 + 5, y1 - 5),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

    return result_img


# Save image to disk
def save_image(image, detection_id):
    filename = f"{detection_id}.jpg"
    filepath = os.path.join(UPLOAD_DIR, filename)
    cv2.imwrite(filepath, image)
    return filepath


# Add detection to history
def add_detection_to_history(image, detections, confidence_scores, class_names, source_type, processing_time):
    # Count weapons (first class is typically the weapon class)
    weapon_count = sum(1 for det in detections if det[5] == 0)

    # Generate unique ID
    detection_id = str(uuid.uuid4())

    # Save image with detections
    image_path = None
    if image is not None:
        image_with_boxes = draw_detections(image, detections,
                                           {i: name for i, name in enumerate(class_names)} if class_names else None)
        image_path = save_image(image_with_boxes, detection_id)

    # Create detection record
    detection = {
        "id": detection_id,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "source_type": source_type,
        "weapon_count": weapon_count,
        "confidence_scores": confidence_scores,
        "processing_time": processing_time,
        "image_path": image_path,
        "class_names": class_names
    }

    # Add to history
    DETECTION_HISTORY.append(detection)

    return detection


# API endpoints
@app.on_event("startup")
async def startup_event():
    # Load model on startup
    get_model()


@app.get("/")
async def root():
    return {"message": "Weapon Detection API is running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "model_loaded": model is not None}


@app.get("/model/info")
async def model_info(model=Depends(get_model)):
    try:
        return {
            "class_names": model.names,
            "model_path": r"E:\ML\Weapon Detection System\weapon-detection-system\backend\best.pt"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting model info: {str(e)}")


@app.post("/detect/image", response_model=DetectionResult)
async def detect_image(
        file: UploadFile = File(...),
        conf_threshold: float = Form(0.25)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    # Load model
    model = get_model()

    try:
        # Read image
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image file")

        # Convert from BGR to RGB
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # Detect weapons
        detections, confidence_scores, class_names, proc_time = detect_weapons(
            model, img_rgb, conf_threshold
        )

        # Add to history if weapons detected
        if any(det[5] == 0 for det in detections):  # Assuming class 0 is weapon
            detection = add_detection_to_history(
                img, detections, confidence_scores, class_names, "Image Upload", proc_time
            )
            return detection

        # If no weapons, return result without adding to history
        return {
            "id": str(uuid.uuid4()),
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "source_type": "Image Upload",
            "weapon_count": 0,
            "confidence_scores": confidence_scores,
            "processing_time": proc_time,
            "class_names": class_names
        }

    except Exception as e:
        logging.error(f"Error processing image: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")


@app.post("/detect/video/upload", response_model=Dict[str, Any])
async def detect_video(
        background_tasks: BackgroundTasks,
        file: UploadFile = File(...),
        conf_threshold: float = Form(0.25),
        frame_skip: int = Form(2)
):
    if not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="Only video files are allowed")

    # Generate job ID and create temp file
    job_id = str(uuid.uuid4())
    temp_file_path = os.path.join(UPLOAD_DIR, f"temp_{job_id}.mp4")

    try:
        # Save uploaded file to temp location
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Start background processing
        background_tasks.add_task(
            process_video_file,
            temp_file_path,
            job_id,
            conf_threshold,
            frame_skip
        )

        return {
            "job_id": job_id,
            "status": "processing",
            "message": "Video processing started"
        }

    except Exception as e:
        logging.error(f"Error uploading video: {e}")
        # Clean up temp file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        raise HTTPException(status_code=500, detail=f"Error uploading video: {str(e)}")


def process_video_file(file_path, job_id, conf_threshold, frame_skip):
    # Load model
    model = get_model()

    # Process video file
    try:
        video_cap = cv2.VideoCapture(file_path)

        if not video_cap.isOpened():
            logging.error(f"Could not open video file: {file_path}")
            return

        frame_count = 0
        weapon_frames = []

        # Process frames
        while video_cap.isOpened():
            ret, frame = video_cap.read()

            if not ret:
                break

            # Process every N frames
            if frame_count % frame_skip == 0:
                # Convert from BGR to RGB
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

                # Resize frame for processing
                rgb_frame = resize_image_to_square(rgb_frame)

                # Detect weapons
                detections, confidence_scores, class_names, proc_time = detect_weapons(
                    model, rgb_frame, conf_threshold
                )

                # Check if weapons detected (assume class 0 is weapon)
                if any(det[5] == 0 for det in detections):
                    # Save significant frame
                    detection = add_detection_to_history(
                        frame, detections, confidence_scores, class_names,
                        "Video Upload", proc_time
                    )
                    weapon_frames.append(detection)

            frame_count += 1

        # Clean up
        video_cap.release()

        # Update job status in a real app, you'd store this in a database
        logging.info(f"Video processing complete. Job ID: {job_id}, Weapons found in {len(weapon_frames)} frames")

        # Clean up temp file
        if os.path.exists(file_path):
            os.remove(file_path)

    except Exception as e:
        logging.error(f"Error processing video: {e}")
        # Clean up temp file
        if os.path.exists(file_path):
            os.remove(file_path)


@app.post("/detect/frame")
async def detect_frame(
        file: UploadFile = File(...),
        conf_threshold: float = Form(0.25)
):
    """Endpoint for processing individual frames (for webcam streaming)"""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    # Load model
    model = get_model()

    try:
        # Read image
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image file")

        # Convert from BGR to RGB
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # Detect weapons
        detections, confidence_scores, class_names, proc_time = detect_weapons(
            model, img_rgb, conf_threshold
        )

        # Draw detections on image
        result_img = draw_detections(img_rgb, detections,
                                     {i: name for i, name in enumerate(class_names)} if class_names else None)

        # Convert back to BGR for encoding
        result_img_bgr = cv2.cvtColor(result_img, cv2.COLOR_RGB2BGR)

        # Encode image to bytes
        _, encoded_img = cv2.imencode('.jpg', result_img_bgr)

        # Count weapons (assume class 0 is weapon)
        weapon_count = sum(1 for det in detections if det[5] == 0)

        # If weapons detected, save to history
        if weapon_count > 0:
            add_detection_to_history(
                img, detections, confidence_scores, class_names, "Webcam", proc_time
            )

        # Return result as JSON with base64 image
        return {
            "weapon_count": weapon_count,
            "confidence_scores": confidence_scores,
            "processing_time": proc_time,
            "detections": [
                {
                    "x1": int(det[0]),
                    "y1": int(det[1]),
                    "x2": int(det[2]),
                    "y2": int(det[3]),
                    "confidence": float(det[4]),
                    "class_id": int(det[5]),
                    "class_name": class_names[i] if i < len(class_names) else f"Class {det[5]}"
                } for i, det in enumerate(detections)
            ],
            "image_bytes": encoded_img.tobytes()
        }

    except Exception as e:
        logging.error(f"Error processing frame: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing frame: {str(e)}")


@app.get("/history", response_model=List[DetectionResult])
async def get_detection_history():
    """Get all detection history"""
    return DETECTION_HISTORY


@app.get("/history/{detection_id}", response_model=DetectionResult)
async def get_detection(detection_id: str):
    """Get specific detection by ID"""
    for detection in DETECTION_HISTORY:
        if detection["id"] == detection_id:
            return detection
    raise HTTPException(status_code=404, detail="Detection not found")


@app.delete("/history/{detection_id}")
async def delete_detection(detection_id: str):
    """Delete specific detection by ID"""
    global DETECTION_HISTORY

    # Find detection
    for i, detection in enumerate(DETECTION_HISTORY):
        if detection["id"] == detection_id:
            # Remove image file if exists
            if detection.get("image_path") and os.path.exists(detection["image_path"]):
                try:
                    os.remove(detection["image_path"])
                except Exception as e:
                    logging.warning(f"Could not delete image file: {e}")

            # Remove from history
            DETECTION_HISTORY.pop(i)
            return {"status": "success", "message": f"Deleted detection {detection_id}"}

    raise HTTPException(status_code=404, detail="Detection not found")


@app.delete("/history")
async def clear_history():
    """Clear all detection history"""
    global DETECTION_HISTORY

    # Delete all image files
    for detection in DETECTION_HISTORY:
        if detection.get("image_path") and os.path.exists(detection["image_path"]):
            try:
                os.remove(detection["image_path"])
            except Exception as e:
                logging.warning(f"Could not delete image file: {e}")

    # Clear history
    DETECTION_HISTORY = []
    return {"status": "success", "message": "Detection history cleared"}


@app.get("/image/{detection_id}")
async def get_detection_image(detection_id: str):
    """Get detection image by ID"""
    for detection in DETECTION_HISTORY:
        if detection["id"] == detection_id and detection.get("image_path"):
            if os.path.exists(detection["image_path"]):
                return StreamingResponse(
                    io.open(detection["image_path"], "rb"),
                    media_type="image/jpeg"
                )
            else:
                raise HTTPException(status_code=404, detail="Image file not found")

    raise HTTPException(status_code=404, detail="Detection or image not found")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)