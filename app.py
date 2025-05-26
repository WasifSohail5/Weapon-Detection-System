import streamlit as st
import numpy as np
import cv2
import time
import tempfile
from PIL import Image
import io
import os
from datetime import datetime
import torch

# Add torch import for YOLOv8
try:
    from ultralytics import YOLO
except ImportError:
    st.error("Please install ultralytics: pip install ultralytics")
    st.stop()

# Set page configuration
st.set_page_config(
    page_title="Weapon Detection System",
    page_icon="🔫",
    layout="wide",
    initial_sidebar_state="expanded"
)


# Theme settings and custom CSS
def load_css(is_dark_mode=True):
    # Select base colors based on theme
    if is_dark_mode:
        base_bg = "#121212"
        text_color = "#FFFFFF"
        card_bg = "#1E1E1E"
        highlight_color = "#BB86FC"  # Purple for dark mode
        secondary_color = "#03DAC6"  # Teal for dark mode
        alert_color = "#CF6679"  # Pink-red for dark mode
    else:
        base_bg = "#f5f7fa"
        text_color = "#333333"
        card_bg = "#FFFFFF"
        highlight_color = "#4b4bf5"  # Blue for light mode
        secondary_color = "#38b000"  # Green for light mode
        alert_color = "#ff4b4b"  # Red for light mode

    st.markdown(f"""
    <style>
        .main-title {{
            color: {highlight_color};
            font-size: 3rem !important;
            font-weight: 600;
            margin-bottom: 1rem;
            text-align: center;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }}

        .sub-title {{
            color: {secondary_color};
            font-size: 1.8rem !important;
            font-weight: 500;
            margin-bottom: 1rem;
            text-align: center;
        }}

        .stApp {{
            background: {base_bg};
            color: {text_color};
        }}

        .detection-card {{
            background-color: {card_bg};
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            margin-bottom: 20px;
            color: {text_color};
        }}

        .detection-info {{
            background-color: {base_bg};
            border-left: 5px solid {highlight_color};
            padding: 15px;
            border-radius: 5px;
            margin-top: 10px;
        }}

        .status-container {{
            background-color: {card_bg};
            border-radius: 10px;
            padding: 10px;
            margin: 10px 0;
            border: 1px solid rgba(128, 128, 128, 0.2);
        }}

        .header-container {{
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: {card_bg};
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }}

        /* Custom button styling */
        .stButton>button {{
            background-color: {highlight_color};
            color: {'white' if is_dark_mode else '#FFFFFF'};
            font-weight: 500;
            border-radius: 5px;
            padding: 0.5rem 1rem;
            border: none;
            transition: all 0.3s;
        }}

        .stButton>button:hover {{
            opacity: 0.9;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            transform: translateY(-2px);
        }}

        /* Alert box */
        .weapon-alert {{
            background-color: {'rgba(207, 102, 121, 0.2)' if is_dark_mode else 'rgba(255, 75, 75, 0.1)'};
            border-left: 5px solid {alert_color};
            padding: 15px;
            border-radius: 5px;
            color: {alert_color};
            font-weight: 500;
            margin: 15px 0;
            animation: pulse 2s infinite;
        }}

        @keyframes pulse {{
            0% {{ box-shadow: 0 0 0 0 {'rgba(207, 102, 121, 0.7)' if is_dark_mode else 'rgba(255, 75, 75, 0.7)'}; }}
            70% {{ box-shadow: 0 0 0 10px {'rgba(207, 102, 121, 0)' if is_dark_mode else 'rgba(255, 75, 75, 0)'}; }}
            100% {{ box-shadow: 0 0 0 0 {'rgba(207, 102, 121, 0)' if is_dark_mode else 'rgba(255, 75, 75, 0)'}; }}
        }}

        /* Stats card */
        .stat-card {{
            background-color: {card_bg};
            border-radius: 10px;
            padding: 15px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            text-align: center;
            transition: transform 0.3s;
        }}

        .stat-card:hover {{
            transform: translateY(-5px);
            box-shadow: 0 8px 15px rgba(0,0,0,0.1);
        }}

        .stat-number {{
            font-size: 2rem;
            font-weight: 600;
            color: {highlight_color};
        }}

        .stat-label {{
            font-size: 0.9rem;
            color: {'#BBBBBB' if is_dark_mode else '#6c757d'};
        }}

        /* Image container */
        .img-container {{
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }}

        /* Footer */
        .footer {{
            text-align: center;
            padding: 20px 0;
            color: {'#BBBBBB' if is_dark_mode else '#6c757d'};
            font-size: 0.9rem;
            margin-top: 50px;
            border-top: 1px solid {'rgba(255,255,255,0.1)' if is_dark_mode else '#dee2e6'};
        }}

        /* Theme selector styling */
        .theme-selector {{
            background-color: {card_bg};
            padding: 10px;
            border-radius: 8px;
            margin-bottom: 15px;
        }}

        /* Slider customizations */
        .stSlider div[data-baseweb="slider"] div[role="slider"] {{
            background-color: {highlight_color} !important;
        }}
    </style>
    """, unsafe_allow_html=True)


# Initialize theme settings in session state if not already there
if 'dark_mode' not in st.session_state:
    st.session_state.dark_mode = True  # Default to dark mode

if 'theme_color' not in st.session_state:
    st.session_state.theme_color = 'purple'  # Default to purple theme


# App header
def display_header():
    col1, col2, col3 = st.columns([1, 4, 1])
    with col2:
        st.markdown('<div class="header-container">'
                    '<div>'
                    '<h1 class="main-title">🔫 Weapon Detection System</h1>'
                    '<p class="sub-title">Real-time security monitoring powered by YOLOv8</p>'
                    '</div>'
                    '</div>', unsafe_allow_html=True)


# Initialize session state variables
if 'detection_count' not in st.session_state:
    st.session_state.detection_count = 0
if 'processing_time' not in st.session_state:
    st.session_state.processing_time = []
if 'detections' not in st.session_state:
    st.session_state.detections = []
if 'history' not in st.session_state:
    st.session_state.history = []
if 'page' not in st.session_state:
    st.session_state.page = 'image'


# Load the PyTorch model
@st.cache_resource
def load_model(model_path=r"E:\ML\Weapon Detection System\best.pt"):
    try:
        # Load YOLOv8 model using ultralytics
        model = YOLO(model_path)
        return model
    except Exception as e:
        st.error(f"Failed to load model: {e}")
        return None


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


# Modified detect_weapons function for PyTorch model
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

        # Extract detection results
        for result in results:
            boxes = result.boxes

            # Process each detection
            for i, box in enumerate(boxes):
                # Get box coordinates (in xyxy format)
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()

                # Get confidence
                conf = float(box.conf[0].cpu().numpy())

                # Get class ID
                cls_id = int(box.cls[0].cpu().numpy())

                # Format: [x1, y1, x2, y2, score, class_id]
                detections.append([int(x1), int(y1), int(x2), int(y2), conf, cls_id])

        proc_time = time.time() - start_time
        return detections, proc_time

    except Exception as e:
        st.error(f"Inference error: {e}")
        return [], time.time() - start_time


# Draw bounding boxes on image
def draw_detections(img, detections, model=None):
    # Get image colors based on theme
    is_dark = st.session_state.dark_mode

    # Select colors based on theme and user preference
    if is_dark:
        weapon_color = {
            'blue': (255, 100, 50),  # Orange-ish in BGR
            'green': (50, 255, 50),  # Green in BGR
            'red': (50, 50, 255),  # Red in BGR
            'purple': (255, 50, 200),  # Purple in BGR
            'yellow': (0, 255, 255)  # Yellow in BGR
        }
    else:
        weapon_color = {
            'blue': (255, 0, 0),  # Blue in BGR
            'green': (0, 255, 0),  # Green in BGR
            'red': (0, 0, 255),  # Red in BGR
            'purple': (255, 0, 128),  # Purple in BGR
            'yellow': (0, 255, 255)  # Yellow in BGR
        }

    # Get current theme color
    color_key = st.session_state.theme_color

    # Get class names if model is provided
    class_names = None
    if model is not None:
        try:
            class_names = model.names
        except:
            class_names = None

    if class_names is None:
        # Default class_names if we can't get them from the model
        class_names = {0: 'weapon', 1: 'background'}

    for box in detections:
        x1, y1, x2, y2, score, class_id = box

        # Make sure class_id is within range of class_names
        if isinstance(class_names, dict) and class_id in class_names:
            label = f"{class_names[class_id]} {score:.2f}"
        else:
            label = f"Class {class_id} {score:.2f}"

        # Set colors based on class and theme
        if class_id == 0:  # Weapon class (typically)
            color = weapon_color[color_key]
        else:
            color = (128, 128, 128)  # Gray for other classes

        # Draw rectangle with improved visibility
        thickness = 3 if is_dark else 2
        cv2.rectangle(img, (x1, y1), (x2, y2), color, thickness)

        # Draw label background with improved contrast
        text_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.7, 2)[0]
        cv2.rectangle(img, (x1, y1 - 25), (x1 + text_size[0] + 10, y1), color, -1)

        # Draw label text with improved visibility
        cv2.putText(img, label, (x1 + 5, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX,
                    0.7, (255, 255, 255), 2)

    return img


# Save detection history
def save_detection(img, detections, source_type, model=None):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Get class names if model is provided
    class_names = None
    if model is not None:
        try:
            class_names = model.names
        except:
            class_names = None

    # Determine what to count as weapons based on available classes
    weapon_count = 0
    if class_names is not None:
        # Look for weapon-related classes
        weapon_classes = [cls_id for cls_id, name in class_names.items()
                          if 'weapon' in name.lower() or 'gun' in name.lower()
                          or 'pistol' in name.lower() or 'rifle' in name.lower()
                          or 'knife' in name.lower()]

        if weapon_classes:
            weapon_count = sum(1 for det in detections if det[5] in weapon_classes)
        else:
            # If no weapon class found, assume class 0 is weapon (common in custom models)
            weapon_count = sum(1 for det in detections if det[5] == 0)
    else:
        # Default: assume class 0 is weapon
        weapon_count = sum(1 for det in detections if det[5] == 0)

    # Record only if weapons are detected
    if weapon_count > 0:
        st.session_state.detection_count += 1
        st.session_state.history.append({
            'id': st.session_state.detection_count,
            'timestamp': timestamp,
            'source': source_type,
            'weapon_count': weapon_count,
        })


# Page for image upload and detection
def image_detection_page():
    st.markdown('<h2 class="sub-title">Image Weapon Detection</h2>', unsafe_allow_html=True)

    # Get model
    model = st.session_state.model if 'model' in st.session_state else None
    if model is None:
        model = load_model()
        st.session_state.model = model

    # Create columns for upload options
    col1, col2 = st.columns(2)

    with col1:
        st.markdown('<div class="detection-card">', unsafe_allow_html=True)
        st.markdown("### Upload Image")
        uploaded_file = st.file_uploader("Choose an image file", type=["jpg", "jpeg", "png"])

        # Display sample images
        st.markdown("### Or try a sample image")
        sample_col1, sample_col2 = st.columns(2)

        with sample_col1:
            if st.button("Sample 1"):
                uploaded_file = "sample_images/weapon1.jpg"

        with sample_col2:
            if st.button("Sample 2"):
                uploaded_file = "sample_images/weapon2.jpg"

        # Detection threshold
        conf_threshold = st.slider("Confidence threshold", min_value=0.1, max_value=0.9, value=0.25, step=0.05)

        # Add class names display
        if model is not None:
            st.markdown("### Model Information")
            try:
                class_names = model.names
                st.write("**Detected Classes:**")
                for cls_id, name in class_names.items():
                    st.write(f"Class {cls_id}: {name}")
            except:
                st.write("Could not determine class names")

        st.markdown('</div>', unsafe_allow_html=True)

    with col2:
        st.markdown('<div class="detection-card">', unsafe_allow_html=True)
        st.markdown("### Detection Results")

        if uploaded_file is not None:
            # Check if it's a path or uploaded file
            if isinstance(uploaded_file, str):
                if os.path.exists(uploaded_file):
                    image = cv2.imread(uploaded_file)
                    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                else:
                    st.error(f"Sample image not found: {uploaded_file}")
                    return
            else:
                # Process uploaded file
                file_bytes = np.asarray(bytearray(uploaded_file.read()), dtype=np.uint8)
                image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
                image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

            # Keep a copy of original for display
            original_image = image.copy()

            # Resize image to 640x640 for processing
            image = resize_image_to_square(image, target_size=(640, 640))

            # Show the resized image size for debugging
            st.markdown(f"<div class='detection-info'>Image resized to: {image.shape[1]}x{image.shape[0]}</div>",
                        unsafe_allow_html=True)

            # Check if model is loaded
            if model is None:
                st.error("Failed to load the model. Please check if the PT file exists.")
                return

            # Perform detection
            with st.spinner("Detecting weapons..."):
                detections, proc_time = detect_weapons(model, image, conf_threshold)
                st.session_state.processing_time.append(proc_time)

                # Draw boxes on the resized image (640x640)
                result_img = draw_detections(image.copy(), detections, model)

                # Save detection to history if weapons found
                if len(detections) > 0:
                    save_detection(image, detections, "Image Upload", model)

            # Display results - determine what counts as a weapon
            weapon_count = 0
            try:
                class_names = model.names
                # Look for weapon-related classes
                weapon_classes = [cls_id for cls_id, name in class_names.items()
                                  if 'weapon' in name.lower() or 'gun' in name.lower()
                                  or 'pistol' in name.lower() or 'rifle' in name.lower()
                                  or 'knife' in name.lower()]

                if weapon_classes:
                    weapon_count = sum(1 for det in detections if det[5] in weapon_classes)
                else:
                    # If no weapon class found, assume class 0 is weapon (common in custom models)
                    weapon_count = sum(1 for det in detections if det[5] == 0)
            except:
                # Default: assume class 0 is weapon
                weapon_count = sum(1 for det in detections if det[5] == 0)

            if weapon_count > 0:
                st.markdown(
                    f'<div class="weapon-alert">⚠️ ALERT: {weapon_count} weapon{"s" if weapon_count > 1 else ""} detected!</div>',
                    unsafe_allow_html=True)

            # Display image with detections
            st.markdown('<div class="img-container">', unsafe_allow_html=True)
            st.image(result_img, caption="Detection Results (640x640)", use_container_width=True)
            st.markdown('</div>', unsafe_allow_html=True)

            # Display detection info
            st.markdown('<div class="detection-info">', unsafe_allow_html=True)
            st.markdown(f"**Processing time:** {proc_time:.4f} seconds")
            st.markdown(f"**Total objects detected:** {len(detections)}")
            st.markdown(f"**Weapons detected:** {weapon_count}")

            # Show detailed detection info
            if len(detections) > 0:
                st.markdown("### Detection Details:")
                for i, det in enumerate(detections):
                    x1, y1, x2, y2, score, cls_id = det
                    try:
                        class_name = model.names[cls_id]
                    except:
                        class_name = f"Class {cls_id}"
                    st.markdown(f"**Detection {i + 1}:** {class_name} (Confidence: {score:.2f})")

            st.markdown('</div>', unsafe_allow_html=True)
        else:
            st.info("Please upload an image to start detection")

        st.markdown('</div>', unsafe_allow_html=True)

    # Statistics section
    st.markdown('<h3 class="sub-title">Detection Statistics</h3>', unsafe_allow_html=True)
    col1, col2, col3 = st.columns(3)

    with col1:
        st.markdown('<div class="stat-card">', unsafe_allow_html=True)
        st.markdown(f'<div class="stat-number">{st.session_state.detection_count}</div>', unsafe_allow_html=True)
        st.markdown('<div class="stat-label">Total Detections</div>', unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)

    with col2:
        avg_time = sum(st.session_state.processing_time) / max(len(st.session_state.processing_time), 1)
        st.markdown('<div class="stat-card">', unsafe_allow_html=True)
        st.markdown(f'<div class="stat-number">{avg_time:.3f}s</div>', unsafe_allow_html=True)
        st.markdown('<div class="stat-label">Average Processing Time</div>', unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)

    with col3:
        st.markdown('<div class="stat-card">', unsafe_allow_html=True)
        st.markdown(f'<div class="stat-number">{len(st.session_state.history)}</div>', unsafe_allow_html=True)
        st.markdown('<div class="stat-label">Weapon Alerts</div>', unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)


# Page for video upload and detection
def video_detection_page():
    st.markdown('<h2 class="sub-title">Video Weapon Detection</h2>', unsafe_allow_html=True)

    # Get model
    model = st.session_state.model if 'model' in st.session_state else None
    if model is None:
        model = load_model()
        st.session_state.model = model

    col1, col2 = st.columns([1, 2])

    with col1:
        st.markdown('<div class="detection-card">', unsafe_allow_html=True)
        st.markdown("### Upload Video")
        uploaded_file = st.file_uploader("Choose a video file", type=["mp4", "avi", "mov"])

        # Sample videos
        st.markdown("### Or try a sample video")
        if st.button("Sample Video"):
            uploaded_file = "sample_videos/video1.mp4"

        # Detection parameters
        conf_threshold = st.slider("Confidence threshold", min_value=0.1, max_value=0.9, value=0.25, step=0.05)
        frame_skip = st.slider("Process every N frames", min_value=1, max_value=10, value=2)

        # Start detection button
        start_detection = st.button("Start Detection")
        stop_detection = st.button("Stop Detection")

        if stop_detection:
            st.session_state.run_detection = False

        st.markdown('</div>', unsafe_allow_html=True)

        # Detection stats
        if 'video_stats' not in st.session_state:
            st.session_state.video_stats = {
                'frames_processed': 0,
                'weapons_detected': 0,
                'current_fps': 0,
            }

        st.markdown('<div class="detection-card">', unsafe_allow_html=True)
        st.markdown("### Detection Stats")
        st.markdown('<div class="status-container">', unsafe_allow_html=True)
        stats_cols = st.columns(2)

        with stats_cols[0]:
            st.metric("Frames Processed", st.session_state.video_stats['frames_processed'])
            st.metric("Processing FPS", f"{st.session_state.video_stats['current_fps']:.1f}")

        with stats_cols[1]:
            st.metric("Weapons Detected", st.session_state.video_stats['weapons_detected'])
            if st.session_state.video_stats['weapons_detected'] > 0:
                st.markdown('<div class="weapon-alert">⚠️ WEAPONS DETECTED!</div>', unsafe_allow_html=True)

        st.markdown('</div>', unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)

    with col2:
        st.markdown('<div class="detection-card">', unsafe_allow_html=True)
        st.markdown("### Detection Results")

        # Video display area
        video_placeholder = st.empty()

        # Process video if requested
        if uploaded_file is not None and start_detection:
            # Reset stats
            st.session_state.video_stats = {
                'frames_processed': 0,
                'weapons_detected': 0,
                'current_fps': 0,
            }
            st.session_state.run_detection = True

            # Check if model is loaded
            if model is None:
                st.error("Failed to load the model. Please check if the PT file exists.")
                return

            # Process the video
            tfile_name = None  # Initialize variable to store temp file name

            if isinstance(uploaded_file, str):
                if os.path.exists(uploaded_file):
                    video_cap = cv2.VideoCapture(uploaded_file)
                else:
                    st.error(f"Sample video not found: {uploaded_file}")
                    return
            else:
                # Save uploaded video to temporary file with improved handling
                try:
                    tfile = tempfile.NamedTemporaryFile(delete=False)
                    tfile_name = tfile.name  # Store the name for later cleanup
                    tfile.write(uploaded_file.read())
                    tfile.close()  # Close file handle before passing to OpenCV
                    video_cap = cv2.VideoCapture(tfile_name)
                except Exception as e:
                    st.error(f"Error loading video: {e}")
                    # Clean up the temp file if it was created
                    if tfile_name and os.path.exists(tfile_name):
                        try:
                            os.unlink(tfile_name)
                        except:
                            pass
                    return

            # Get video properties
            width = int(video_cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(video_cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            fps = video_cap.get(cv2.CAP_PROP_FPS)

            frame_count = 0

            # Process frames until video ends or stop is requested
            while video_cap.isOpened() and st.session_state.run_detection:
                ret, frame = video_cap.read()

                if not ret:
                    break

                # Process every N frames
                if frame_count % frame_skip == 0:
                    start_time = time.time()

                    # Convert from BGR to RGB
                    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

                    # Resize frame to 640x640 for processing
                    rgb_frame = resize_image_to_square(rgb_frame, target_size=(640, 640))

                    # Perform detection
                    detections, proc_time = detect_weapons(model, rgb_frame, conf_threshold)

                    # Determine what counts as weapons
                    weapon_count = 0
                    try:
                        class_names = model.names
                        # Look for weapon-related classes
                        weapon_classes = [cls_id for cls_id, name in class_names.items()
                                          if 'weapon' in name.lower() or 'gun' in name.lower()
                                          or 'pistol' in name.lower() or 'rifle' in name.lower()
                                          or 'knife' in name.lower()]

                        if weapon_classes:
                            weapon_count = sum(1 for det in detections if det[5] in weapon_classes)
                        else:
                            # If no weapon class found, assume class 0 is weapon (common in custom models)
                            weapon_count = sum(1 for det in detections if det[5] == 0)
                    except:
                        # Default: assume class 0 is weapon
                        weapon_count = sum(1 for det in detections if det[5] == 0)

                    if weapon_count > 0:
                        st.session_state.video_stats['weapons_detected'] += weapon_count

                    # Draw boxes on frame
                    result_img = draw_detections(rgb_frame, detections, model)

                    # Add frame info
                    cv2.putText(result_img, f"Frame: {frame_count}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6,
                                (0, 255, 0), 2)

                    # Calculate FPS
                    fps_text = f"FPS: {1 / proc_time:.1f}"
                    cv2.putText(result_img, fps_text, (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

                    # Add weapon detection status
                    if weapon_count > 0:
                        status_text = f"ALERT: {weapon_count} weapons detected!"
                        cv2.putText(result_img, status_text, (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)

                        # Save significant detections
                        if frame_count % (5 * frame_skip) == 0:  # Save every 5 processed frames with weapons
                            save_detection(rgb_frame, detections, "Video", model)

                    # Update stats
                    st.session_state.video_stats['frames_processed'] += 1
                    st.session_state.video_stats['current_fps'] = 1 / proc_time

                    # Display the frame
                    video_placeholder.image(result_img, caption="Video Detection (640x640)", use_container_width=True)

                frame_count += 1

            # Clean up
            video_cap.release()

            # Clean up the temporary file with improved error handling
            if tfile_name and os.path.exists(tfile_name):
                try:
                    # Add a small delay to ensure file is released
                    time.sleep(0.5)
                    os.unlink(tfile_name)
                except Exception as e:
                    st.warning(f"Could not delete temporary file: {e}")
                    st.info("Temporary files will be cleaned up by the system later.")

            st.success("Video processing complete!")

        else:
            st.info("Upload a video and click 'Start Detection' to begin")

        st.markdown('</div>', unsafe_allow_html=True)


# Page for webcam detection
def webcam_detection_page():
    st.markdown('<h2 class="sub-title">Real-time Webcam Detection</h2>', unsafe_allow_html=True)

    # Get model
    model = st.session_state.model if 'model' in st.session_state else None
    if model is None:
        model = load_model()
        st.session_state.model = model

    col1, col2 = st.columns([1, 2])

    with col1:
        st.markdown('<div class="detection-card">', unsafe_allow_html=True)
        st.markdown("### Camera Settings")

        # Camera selection
        camera_option = st.selectbox("Select camera", ["Default (0)", "External (1)", "Virtual (2)"])
        camera_id_map = {"Default (0)": 0, "External (1)": 1, "Virtual (2)": 2}
        camera_id = camera_id_map[camera_option]

        # Detection settings
        conf_threshold = st.slider("Confidence threshold", min_value=0.1, max_value=0.9, value=0.25, step=0.05)

        # Start/Stop camera
        start_cam = st.button("Start Camera")
        stop_cam = st.button("Stop Camera")

        if stop_cam:
            st.session_state.run_webcam = False

        # Screenshot button
        take_screenshot = st.button("Take Screenshot")

        if 'screenshot_img' not in st.session_state:
            st.session_state.screenshot_img = None
            st.session_state.screenshot_detections = []

        st.markdown('</div>', unsafe_allow_html=True)

        # Detection stats
        if 'webcam_stats' not in st.session_state:
            st.session_state.webcam_stats = {
                'frames_processed': 0,
                'weapons_detected': 0,
                'current_fps': 0,
                'alert_status': False
            }

        st.markdown('<div class="detection-card">', unsafe_allow_html=True)
        st.markdown("### Live Stats")
        st.markdown('<div class="status-container">', unsafe_allow_html=True)

        webcam_cols = st.columns(2)
        with webcam_cols[0]:
            st.metric("FPS", f"{st.session_state.webcam_stats['current_fps']:.1f}")
            st.metric("Frames Processed", st.session_state.webcam_stats['frames_processed'])

        with webcam_cols[1]:
            st.metric("Weapons Detected", st.session_state.webcam_stats['weapons_detected'])
            if st.session_state.webcam_stats['alert_status']:
                st.markdown('<div class="weapon-alert">⚠️ LIVE ALERT!</div>', unsafe_allow_html=True)

        st.markdown('</div>', unsafe_allow_html=True)

        # Screenshot display
        if st.session_state.screenshot_img is not None:
            st.markdown("### Screenshot")
            st.image(st.session_state.screenshot_img, caption="Screenshot", use_container_width=True)

            # Determine what counts as weapons
            weapon_count = 0
            try:
                class_names = model.names
                # Look for weapon-related classes
                weapon_classes = [cls_id for cls_id, name in class_names.items()
                                  if 'weapon' in name.lower() or 'gun' in name.lower()
                                  or 'pistol' in name.lower() or 'rifle' in name.lower()
                                  or 'knife' in name.lower()]

                if weapon_classes:
                    weapon_count = sum(1 for det in st.session_state.screenshot_detections if det[5] in weapon_classes)
                else:
                    # If no weapon class found, assume class 0 is weapon (common in custom models)
                    weapon_count = sum(1 for det in st.session_state.screenshot_detections if det[5] == 0)
            except:
                # Default: assume class 0 is weapon
                weapon_count = sum(1 for det in st.session_state.screenshot_detections if det[5] == 0)

            if weapon_count > 0:
                st.markdown(f"⚠️ **{weapon_count}** weapon{'s' if weapon_count > 1 else ''} detected!")
            else:
                st.markdown("No weapons detected")

            if st.button("Save Screenshot"):
                # Convert image to bytes
                img = Image.fromarray(st.session_state.screenshot_img)
                buf = io.BytesIO()
                img.save(buf, format="PNG")
                byte_im = buf.getvalue()

                # Provide download button
                timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
                st.download_button(
                    label="Download Screenshot",
                    data=byte_im,
                    file_name=f"weapon_detection_{timestamp}.png",
                    mime="image/png"
                )

        st.markdown('</div>', unsafe_allow_html=True)

    with col2:
        st.markdown('<div class="detection-card">', unsafe_allow_html=True)
        st.markdown("### Live Camera Feed")

        # Video display area
        cam_placeholder = st.empty()

        # Process webcam feed
        if start_cam:
            # Reset stats
            st.session_state.webcam_stats = {
                'frames_processed': 0,
                'weapons_detected': 0,
                'current_fps': 0,
                'alert_status': False
            }
            st.session_state.run_webcam = True

            # Check if model is loaded
            if model is None:
                st.error("Failed to load the model. Please check if the PT file exists.")
                return

            # Open webcam
            try:
                video_cap = cv2.VideoCapture(camera_id)

                # Check if camera opened successfully
                if not video_cap.isOpened():
                    st.error(f"Error: Unable to open camera {camera_id}")
                    st.session_state.run_webcam = False
                    return

                # Set camera resolution
                video_cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
                video_cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

                frame_count = 0
                fps_update_interval = 10  # Update FPS every 10 frames
                frame_times = []

                # Process frames until stop is requested
                while video_cap.isOpened() and st.session_state.run_webcam:
                    ret, frame = video_cap.read()

                    if not ret:
                        st.error("Error: Failed to capture frame from camera")
                        break

                    start_time = time.time()

                    # Convert from BGR to RGB
                    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

                    # Resize frame to 640x640 for processing
                    rgb_frame = resize_image_to_square(rgb_frame, target_size=(640, 640))

                    # Take screenshot if requested
                    if take_screenshot and frame_count % 3 == 0:  # Only check every few frames to avoid multiple screenshots
                        st.session_state.screenshot_img = rgb_frame.copy()
                        st.session_state.screenshot_detections = []
                        take_screenshot = False  # Reset flag

                    # Perform detection
                    detections, proc_time = detect_weapons(model, rgb_frame, conf_threshold)

                    # If this is a screenshot, save detections
                    if st.session_state.screenshot_img is not None and np.array_equal(st.session_state.screenshot_img,
                                                                                      rgb_frame):
                        st.session_state.screenshot_detections = detections

                    # Determine what counts as weapons
                    weapon_count = 0
                    try:
                        class_names = model.names
                        # Look for weapon-related classes
                        weapon_classes = [cls_id for cls_id, name in class_names.items()
                                          if 'weapon' in name.lower() or 'gun' in name.lower()
                                          or 'pistol' in name.lower() or 'rifle' in name.lower()
                                          or 'knife' in name.lower()]

                        if weapon_classes:
                            weapon_count = sum(1 for det in detections if det[5] in weapon_classes)
                        else:
                            # If no weapon class found, assume class 0 is weapon (common in custom models)
                            weapon_count = sum(1 for det in detections if det[5] == 0)
                    except:
                        # Default: assume class 0 is weapon
                        weapon_count = sum(1 for det in detections if det[5] == 0)

                    if weapon_count > 0:
                        st.session_state.webcam_stats['weapons_detected'] += weapon_count
                        st.session_state.webcam_stats['alert_status'] = True

                        # Save significant detections (not too frequently)
                        if frame_count % 30 == 0:  # Save every 30 frames with weapons
                            save_detection(rgb_frame, detections, "Webcam", model)
                    else:
                        st.session_state.webcam_stats['alert_status'] = False

                    # Draw boxes on frame
                    result_img = draw_detections(rgb_frame, detections, model)

                    # Calculate and track FPS
                    frame_time = time.time() - start_time
                    frame_times.append(frame_time)
                    if len(frame_times) > fps_update_interval:
                        frame_times.pop(0)

                    avg_frame_time = sum(frame_times) / len(frame_times)
                    current_fps = 1.0 / max(avg_frame_time, 0.001)  # Avoid division by zero

                    # Add frame info
                    cv2.putText(result_img, f"FPS: {current_fps:.1f}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6,
                                (0, 255, 0), 2)

                    # Add weapon detection status
                    if weapon_count > 0:
                        status_text = f"ALERT: {weapon_count} weapons detected!"
                        cv2.putText(result_img, status_text, (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)

                        # Add pulsing alert border
                        border_thickness = int(5 + 5 * abs(np.sin(time.time() * 5)))
                        h, w = result_img.shape[:2]
                        cv2.rectangle(result_img, (0, 0), (w, h), (0, 0, 255), border_thickness)

                    # Update stats
                    st.session_state.webcam_stats['frames_processed'] += 1
                    st.session_state.webcam_stats['current_fps'] = current_fps

                    # Display the frame
                    cam_placeholder.image(result_img, caption="Live Detection (640x640)", use_container_width=True)

                    frame_count += 1

                # Clean up
                video_cap.release()
                st.warning("Camera stopped")

            except Exception as e:
                st.error(f"Error accessing webcam: {e}")
                st.session_state.run_webcam = False

        else:
            st.info("Click 'Start Camera' to begin real-time detection")

        st.markdown('</div>', unsafe_allow_html=True)


# History page
def history_page():
    st.markdown('<h2 class="sub-title">Detection History</h2>', unsafe_allow_html=True)

    # Display history in a table
    if len(st.session_state.history) > 0:
        st.markdown('<div class="detection-card">', unsafe_allow_html=True)

        # Create dataframe
        import pandas as pd
        history_df = pd.DataFrame(st.session_state.history)

        # Add action button
        history_df['Actions'] = ['View' for _ in range(len(history_df))]

        # Display table
        st.dataframe(history_df, use_container_width=True)

        # Allow clearing history
        if st.button("Clear History"):
            st.session_state.history = []
            st.success("History cleared!")
            st.rerun()

        st.markdown('</div>', unsafe_allow_html=True)
    else:
        st.info("No detections recorded yet. History will be populated when weapons are detected.")


# About page
def about_page():
    st.markdown('<h2 class="sub-title">About Weapon Detection System</h2>', unsafe_allow_html=True)

    st.markdown('<div class="detection-card">', unsafe_allow_html=True)
    st.markdown("""
    ## 🔫 Weapon Detection Using YOLOv8

    This application demonstrates real-time weapon detection using YOLOv8, a state-of-the-art object detection model.

    ### Features
    - **Image Detection**: Upload and analyze images for weapons
    - **Video Processing**: Analyze video files for weapon presence
    - **Real-time Detection**: Live webcam monitoring with alerts
    - **Detection History**: Track and review weapon detections

    ### Technical Information
    - **Model**: YOLOv8 PyTorch model trained on custom weapon dataset
    - **Performance**: Approximately 80% precision and recall on test data
    - **Inference Engine**: Ultralytics YOLO with PyTorch backend
    - **Input Processing**: All images/frames are resized to 640x640 before detection

    ### Created By
    Wasif Sohail  
    Email: wasifsohail66@gmail.com  
    GitHub: https://github.com/WasifSohail5/Weapon-Detection-System

    ### Research Reference
    Based on the paper: ["Comprehensive Study on Weapon Detection: A Comparative Analysis using YOLOv8"](https://arxiv.org/pdf/2410.19862)
    """)
    st.markdown('</div>', unsafe_allow_html=True)

    st.markdown('<h3 class="sub-title">How It Works</h3>', unsafe_allow_html=True)

    col1, col2 = st.columns(2)

    with col1:
        st.markdown('<div class="detection-card">', unsafe_allow_html=True)
        st.markdown("""
        ### Detection Pipeline
        1. Image/frame preprocessing and resizing to 640x640
        2. Neural network inference using PyTorch
        3. Post-processing of detection results
        4. Visualization of bounding boxes and alerts
        5. Detection tracking and history recording
        """)
        st.markdown('</div>', unsafe_allow_html=True)

    with col2:
        st.markdown('<div class="detection-card">', unsafe_allow_html=True)
        st.markdown("""
        ### Use Cases
        - **Security Systems**: Monitor public spaces for weapons
        - **Event Security**: Screen attendees for concealed weapons
        - **School Safety**: Alert security personnel to potential threats
        - **Video Surveillance**: Analyze recorded footage for weapon presence
        """)
        st.markdown('</div>', unsafe_allow_html=True)


# Settings page
def settings_page():
    st.markdown('<h2 class="sub-title">App Settings</h2>', unsafe_allow_html=True)

    st.markdown('<div class="detection-card">', unsafe_allow_html=True)
    st.markdown("### Theme Settings")

    # Dark mode toggle
    dark_mode = st.toggle("Dark Mode", value=st.session_state.dark_mode)
    if dark_mode != st.session_state.dark_mode:
        st.session_state.dark_mode = dark_mode
        # Reload CSS with new theme
        st.rerun()

    # Color theme selection
    color_options = {
        'blue': 'Blue Theme',
        'green': 'Green Theme',
        'red': 'Red Theme',
        'purple': 'Purple Theme',
        'yellow': 'Yellow Theme'
    }

    selected_theme = st.selectbox("Color Theme",
                                  options=list(color_options.values()),
                                  index=list(color_options.keys()).index(st.session_state.theme_color))

    # Update theme color if changed
    for key, value in color_options.items():
        if selected_theme == value and key != st.session_state.theme_color:
            st.session_state.theme_color = key
            st.rerun()

    st.markdown("### Model Settings")

    # Model path
    model_path = st.text_input("PyTorch Model Path", value=r"E:\ML\Weapon Detection System\best.pt")

    # Default confidence threshold
    default_conf = st.slider("Default Confidence Threshold",
                             min_value=0.1,
                             max_value=0.9,
                             value=0.25,
                             step=0.05)

    # Reload model button
    if st.button("Reload Model"):
        # Clear model from session state and reload
        if 'model' in st.session_state:
            del st.session_state.model

        st.session_state.model = load_model(model_path)
        if st.session_state.model is not None:
            st.success("Model reloaded successfully!")
            st.session_state.default_conf = default_conf
        else:
            st.error("Failed to reload model.")

    st.markdown('<div class="detection-info">', unsafe_allow_html=True)
    st.markdown("""
    **Note**: Theme changes apply immediately. Model settings require clicking "Reload Model" to take effect.
    """)
    st.markdown('</div>', unsafe_allow_html=True)

    st.markdown('</div>', unsafe_allow_html=True)

    # Class information
    if 'model' in st.session_state and st.session_state.model is not None:
        st.markdown('<div class="detection-card">', unsafe_allow_html=True)
        st.markdown("### Model Information")
        try:
            class_names = st.session_state.model.names
            st.write("**Model Classes:**")
            for cls_id, name in class_names.items():
                st.write(f"Class {cls_id}: {name}")
        except Exception as e:
            st.error(f"Could not determine class names: {e}")
        st.markdown('</div>', unsafe_allow_html=True)

    # Preview section
    st.markdown('<div class="detection-card">', unsafe_allow_html=True)
    st.markdown("### Theme Preview")
    col1, col2 = st.columns(2)

    with col1:
        st.markdown('<div class="stat-card">', unsafe_allow_html=True)
        st.markdown('<div class="stat-number">42</div>', unsafe_allow_html=True)
        st.markdown('<div class="stat-label">Sample Statistic</div>', unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)

    with col2:
        st.markdown('<div class="weapon-alert">⚠️ Sample Alert</div>', unsafe_allow_html=True)

    st.markdown('</div>', unsafe_allow_html=True)


# Main app function
def main():
    # Load CSS with current theme
    load_css(st.session_state.dark_mode)

    # Display header
    display_header()

    # Load model on startup and store in session state
    if 'model' not in st.session_state:
        with st.spinner("Loading model..."):
            model = load_model()
            if model is not None:
                st.session_state.model = model
                # Display success in sidebar
                st.sidebar.success("Model loaded successfully!")
            else:
                st.sidebar.error("Failed to load model. Check the model path.")

    # Sidebar navigation
    st.sidebar.markdown("## 🛠️ Navigation")

    # Navigation options
    options = {
        "image": "📷 Image Detection",
        "video": "🎬 Video Detection",
        "webcam": "📹 Webcam Detection",
        "history": "📚 Detection History",
        "settings": "⚙️ Settings",
        "about": "ℹ️ About"
    }

    selection = st.sidebar.radio("Go to", list(options.values()))

    # Set page based on selection
    for key, value in options.items():
        if selection == value:
            st.session_state.page = key

    # Display selected page
    try:
        if st.session_state.page == "image":
            image_detection_page()
        elif st.session_state.page == "video":
            video_detection_page()
        elif st.session_state.page == "webcam":
            webcam_detection_page()
        elif st.session_state.page == "history":
            history_page()
        elif st.session_state.page == "settings":
            settings_page()
        elif st.session_state.page == "about":
            about_page()
    except Exception as e:
        st.error(f"An error occurred: {e}")
        st.info("Try adjusting settings or restarting the application.")

    # Additional sidebar info
    st.sidebar.markdown("## 📊 Current Session")
    st.sidebar.markdown(f"**Total Detections:** {st.session_state.detection_count}")
    st.sidebar.markdown(f"**Alerts Recorded:** {len(st.session_state.history)}")

    if len(st.session_state.processing_time) > 0:
        avg_time = sum(st.session_state.processing_time) / len(st.session_state.processing_time)
        st.sidebar.markdown(f"**Avg. Processing:** {avg_time:.4f}s")

    # Display model info in sidebar
    if 'model' in st.session_state and st.session_state.model is not None:
        try:
            class_names = st.session_state.model.names
            weapon_classes = [cls_id for cls_id, name in class_names.items()
                              if 'weapon' in name.lower() or 'gun' in name.lower()
                              or 'pistol' in name.lower() or 'rifle' in name.lower()
                              or 'knife' in name.lower()]
            if weapon_classes:
                st.sidebar.markdown(f"**Weapon classes:** {', '.join([str(c) for c in weapon_classes])}")
            else:
                st.sidebar.markdown("**Note:** Using class 0 as weapon class")
        except:
            pass

    # Current theme info
    st.sidebar.markdown("### Current Theme")
    theme_info = "🌙 Dark" if st.session_state.dark_mode else "☀️ Light"
    color_emoji = {
        'blue': '🔷',
        'green': '🟢',
        'red': '🔴',
        'purple': '🟣',
        'yellow': '🟡'
    }
    theme_info += f" | {color_emoji[st.session_state.theme_color]} {st.session_state.theme_color.capitalize()}"
    st.sidebar.markdown(theme_info)

    # Footer
    st.markdown('<div class="footer">', unsafe_allow_html=True)
    st.markdown("© 2025 Weapon Detection System | Created by Wasif Sohail")
    st.markdown('</div>', unsafe_allow_html=True)


if __name__ == "__main__":
    main()