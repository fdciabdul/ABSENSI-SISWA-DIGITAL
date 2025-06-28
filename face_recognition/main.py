import customtkinter as ctk
from tkinter import messagebox, simpledialog
import cv2
import numpy as np
import requests
import json
from PIL import Image, ImageTk
import threading
import time
import hashlib

ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")

class SistemAbsensiModern:
    def __init__(self):
        self.root = ctk.CTk()
        self.root.title("Sistem Absensi Pintar")
        self.root.geometry("1200x800")
        self.root.minsize(1000, 700)
        
        self.api_base_url = "http://localhost:3333"
        self.camera = None
        self.is_camera_running = False
        self.admin_password = "admin123"
        
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        self.known_faces = {}
        self.face_templates = []
        self.all_students = []
        
        self.auto_detect_enabled = False
        self.last_detection_time = {}
        self.detection_cooldown = 10
        self.detection_confidence_threshold = 75
        
        self.session_detections = 0
        self.session_attendances = 0
        self.session_start_time = None
        
        self.setup_ui()
        self.root.after(1000, self.initialize_data)
    
    def setup_ui(self):
        self.root.grid_columnconfigure(1, weight=1)
        self.root.grid_rowconfigure(1, weight=1)
        
        self.create_sidebar()
        self.create_main_area()
        self.create_status_bar()
    
    def create_sidebar(self):
        sidebar = ctk.CTkFrame(self.root, width=280, corner_radius=0)
        sidebar.grid(row=0, column=0, rowspan=3, sticky="nsew")
        sidebar.grid_rowconfigure(7, weight=1)
        
        title = ctk.CTkLabel(sidebar, text="🎓 Sistem Absensi", font=ctk.CTkFont(size=20, weight="bold"))
        title.grid(row=0, column=0, padx=20, pady=(20, 10))
        
        self.connection_status = ctk.CTkLabel(sidebar, text="🔄 Mengecek...", font=ctk.CTkFont(size=12))
        self.connection_status.grid(row=1, column=0, padx=20, pady=5)
        
        ctk.CTkLabel(sidebar, text="Kontrol", font=ctk.CTkFont(size=16, weight="bold")).grid(row=2, column=0, padx=20, pady=(20, 10))
        
        self.start_btn = ctk.CTkButton(sidebar, text="▶️ Mulai Deteksi", command=self.start_auto_detection, height=40)
        self.start_btn.grid(row=3, column=0, padx=20, pady=5, sticky="ew")
        
        self.stop_btn = ctk.CTkButton(sidebar, text="⏹️ Hentikan Deteksi", command=self.stop_auto_detection, 
                                     height=40, fg_color="red", hover_color="darkred", state="disabled")
        self.stop_btn.grid(row=4, column=0, padx=20, pady=5, sticky="ew")
        
        self.register_btn = ctk.CTkButton(sidebar, text="👤 Daftar Wajah", command=self.open_registration_with_password,
                                        height=40, fg_color="green", hover_color="darkgreen")
        self.register_btn.grid(row=5, column=0, padx=20, pady=5, sticky="ew")
        self.settings_btn = ctk.CTkButton(sidebar, text="⚙️ Pengaturan", command=self.open_settings,
                                height=40, fg_color="purple", hover_color="darkviolet")
        self.settings_btn.grid(row=6, column=0, padx=20, pady=5, sticky="ew")
        
        stats_frame = ctk.CTkFrame(sidebar)
        stats_frame.grid(row=8, column=0, padx=20, pady=20, sticky="ew")
        
        ctk.CTkLabel(stats_frame, text="Statistik Sesi", font=ctk.CTkFont(size=14, weight="bold")).pack(pady=(10, 5))
        
        self.detections_label = ctk.CTkLabel(stats_frame, text="Deteksi: 0", font=ctk.CTkFont(size=12))
        self.detections_label.pack(pady=2)
        
        self.attendance_label = ctk.CTkLabel(stats_frame, text="Kehadiran: 0", font=ctk.CTkFont(size=12))
        self.attendance_label.pack(pady=2)
        
        self.student_count_label = ctk.CTkLabel(stats_frame, text="Siswa: 0", font=ctk.CTkFont(size=12))
        self.student_count_label.pack(pady=(2, 10))
        
        self.auto_detect_var = ctk.BooleanVar(value=True)
        auto_checkbox = ctk.CTkCheckBox(sidebar, text="Rekam Otomatis", variable=self.auto_detect_var)
        auto_checkbox.grid(row=9, column=0, padx=20, pady=10)
    
    def create_main_area(self):
        main_frame = ctk.CTkFrame(self.root)
        main_frame.grid(row=0, column=1, rowspan=2, sticky="nsew", padx=(0, 20), pady=20)
        main_frame.grid_columnconfigure(0, weight=2)
        main_frame.grid_columnconfigure(1, weight=1)
        main_frame.grid_rowconfigure(1, weight=1)
        
        header_frame = ctk.CTkFrame(main_frame, height=60)
        header_frame.grid(row=0, column=0, columnspan=2, sticky="ew", padx=20, pady=(20, 10))
        header_frame.grid_columnconfigure(1, weight=1)
        
        ctk.CTkLabel(header_frame, text="Kamera Langsung", font=ctk.CTkFont(size=18, weight="bold")).grid(row=0, column=0, padx=20, pady=15)
        
        self.detection_status = ctk.CTkLabel(header_frame, text="⏸️ Berhenti", font=ctk.CTkFont(size=14, weight="bold"), text_color="red")
        self.detection_status.grid(row=0, column=1, padx=20, pady=15, sticky="e")
        
        camera_frame = ctk.CTkFrame(main_frame)
        camera_frame.grid(row=1, column=0, sticky="nsew", padx=(20, 10), pady=(0, 20))
        
        self.camera_label = ctk.CTkLabel(camera_frame, text="📹 Kamera akan dimulai di sini", width=600, height=400, fg_color="gray20")
        self.camera_label.pack(pady=20, padx=20, expand=True, fill="both")
        
        self.detection_info = ctk.CTkLabel(camera_frame, text="🎯 Siap untuk deteksi", font=ctk.CTkFont(size=14, weight="bold"))
        self.detection_info.pack(pady=(0, 20))
        
        info_frame = ctk.CTkFrame(main_frame)
        info_frame.grid(row=1, column=1, sticky="nsew", padx=(10, 20), pady=(0, 20))
        
        ctk.CTkLabel(info_frame, text="Log Aktivitas", font=ctk.CTkFont(size=16, weight="bold")).pack(pady=(20, 10))
        
        self.activity_log = ctk.CTkTextbox(info_frame, height=200, font=ctk.CTkFont(size=11))
        self.activity_log.pack(fill="both", expand=True, padx=20, pady=(0, 10))
        
        ctk.CTkLabel(info_frame, text="Log Sistem", font=ctk.CTkFont(size=14, weight="bold")).pack(pady=(10, 5))
        
        self.status_log = ctk.CTkTextbox(info_frame, height=150, font=ctk.CTkFont(size=10))
        self.status_log.pack(fill="both", expand=True, padx=20, pady=(0, 20))
    
    def create_status_bar(self):
        status_frame = ctk.CTkFrame(self.root, height=30, corner_radius=0)
        status_frame.grid(row=2, column=1, sticky="ew", padx=(0, 20), pady=(0, 20))
        
        self.status_bar_label = ctk.CTkLabel(status_frame, text="Siap | Sistem diinisialisasi", font=ctk.CTkFont(size=11))
        self.status_bar_label.pack(side="left", padx=15, pady=5)
    
    def verify_admin_password(self):
        password = simpledialog.askstring("Akses Admin", "Masukkan password admin:", show='*')
        if password is None:
            return False
        
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        admin_hash = hashlib.sha256(self.admin_password.encode()).hexdigest()
        
        if password_hash == admin_hash:
            return True
        else:
            messagebox.showerror("Akses Ditolak", "Password salah!")
            return False
    
    def open_registration_with_password(self):
        if self.verify_admin_password():
            self.open_registration()
    
    def open_registration(self):
        reg_window = ctk.CTkToplevel(self.root)
        reg_window.title("Daftar Wajah Siswa")
        reg_window.geometry("800x600")
        reg_window.transient(self.root)
        reg_window.grab_set()
        
        reg_window.grid_columnconfigure((0, 1), weight=1)
        reg_window.grid_rowconfigure(1, weight=1)
        
        ctk.CTkLabel(reg_window, text="👤 Daftar Wajah Siswa", font=ctk.CTkFont(size=20, weight="bold")).grid(row=0, column=0, columnspan=2, pady=20)
        
        left_frame = ctk.CTkFrame(reg_window)
        left_frame.grid(row=1, column=0, sticky="nsew", padx=(20, 10), pady=(0, 20))
        
        ctk.CTkLabel(left_frame, text="Pilih Siswa", font=ctk.CTkFont(size=16, weight="bold")).pack(pady=(20, 10))
        
        self.search_entry = ctk.CTkEntry(left_frame, placeholder_text="Cari siswa...", width=300)
        self.search_entry.pack(pady=5, padx=20)
        self.search_entry.bind("<KeyRelease>", self.filter_students)
        
        self.student_var = ctk.StringVar()
        self.student_dropdown = ctk.CTkComboBox(left_frame, variable=self.student_var, values=[], width=300, command=self.on_student_select)
        self.student_dropdown.pack(pady=10, padx=20)
        
        load_btn = ctk.CTkButton(left_frame, text="📥 Muat Siswa", command=self.load_students_for_registration, width=150)
        load_btn.pack(pady=10)
        
        self.student_info_text = ctk.CTkTextbox(left_frame, width=300, height=200)
        self.student_info_text.pack(fill="both", expand=True, padx=20, pady=20)
        
        right_frame = ctk.CTkFrame(reg_window)
        right_frame.grid(row=1, column=1, sticky="nsew", padx=(10, 20), pady=(0, 20))
        
        ctk.CTkLabel(right_frame, text="Preview Kamera", font=ctk.CTkFont(size=16, weight="bold")).pack(pady=(20, 10))
        
        self.reg_camera_label = ctk.CTkLabel(right_frame, text="Mulai kamera untuk capture", width=300, height=250, fg_color="gray20")
        self.reg_camera_label.pack(pady=10, padx=20)
        
        reg_controls = ctk.CTkFrame(right_frame, fg_color="transparent")
        reg_controls.pack(pady=10)
        
        self.reg_start_btn = ctk.CTkButton(reg_controls, text="📹 Mulai", command=self.start_reg_camera, width=80)
        self.reg_start_btn.pack(side="left", padx=5)
        
        self.reg_stop_btn = ctk.CTkButton(reg_controls, text="⏹️ Stop", command=self.stop_reg_camera, width=80, fg_color="red", hover_color="darkred", state="disabled")
        self.reg_stop_btn.pack(side="left", padx=5)
        
        self.capture_btn = ctk.CTkButton(right_frame, text="📸 Capture Wajah", command=self.capture_for_registration, width=200, height=40, state="disabled", font=ctk.CTkFont(size=14, weight="bold"))
        self.capture_btn.pack(pady=15)
        
        self.reg_status = ctk.CTkLabel(right_frame, text="Pilih siswa dan mulai kamera", font=ctk.CTkFont(size=12))
        self.reg_status.pack(pady=10)
        
        self.reg_camera = None
        self.is_reg_camera_running = False
        self.selected_student = None
        self.filtered_students = []
    
    def start_auto_detection(self):
        self.camera = cv2.VideoCapture(0)
        if not self.camera.isOpened():
            messagebox.showerror("Error", "Tidak dapat membuka kamera")
            return
            
        self.is_camera_running = True
        self.auto_detect_enabled = self.auto_detect_var.get()
        self.session_start_time = time.time()
        self.session_detections = 0
        self.session_attendances = 0
        
        self.start_btn.configure(state="disabled")
        self.stop_btn.configure(state="normal")
        self.detection_status.configure(text="🟢 Berjalan", text_color="green")
        
        self.camera_thread = threading.Thread(target=self.continuous_detection)
        self.camera_thread.daemon = True
        self.camera_thread.start()
        
        self.log_status("🎥 Deteksi dimulai")
    
    def stop_auto_detection(self):
        self.is_camera_running = False
        self.auto_detect_enabled = False
        
        if self.camera:
            self.camera.release()
        
        self.start_btn.configure(state="normal")
        self.stop_btn.configure(state="disabled")
        self.detection_status.configure(text="⏸️ Berhenti", text_color="red")
        
        self.update_detection_info("🛑 Deteksi dihentikan")
        self.log_status("🛑 Deteksi dihentikan")
    
    def continuous_detection(self):
        while self.is_camera_running:
            try:
                ret, frame = self.camera.read()
                if not ret:
                    continue
                
                frame = cv2.flip(frame, 1)
                detection_result = self.process_frame_for_detection(frame)
                
                self.update_camera_display(frame, detection_result)
                
                if self.auto_detect_enabled and detection_result:
                    self.handle_auto_attendance(detection_result)
                
                self.update_session_stats()
                time.sleep(0.1)
                
            except Exception as e:
                self.log_status(f"❌ Error deteksi: {str(e)}")
                time.sleep(1)
    
    def process_frame_for_detection(self, frame):
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(gray, 1.3, 5, minSize=(60, 60))
        
        if len(faces) != 1:
            return None
        
        face_template = self.extract_face_template(frame)
        if face_template is None:
            return None
        
        match_info, confidence = self.compare_faces_template(face_template)
        
        if match_info and confidence > self.detection_confidence_threshold:
            self.session_detections += 1
            return {
                'student': match_info,
                'confidence': confidence,
                'face_box': faces[0],
                'timestamp': time.time()
            }
        
        return None
    
    def update_camera_display(self, frame, detection_result):
        if detection_result:
            x, y, w, h = detection_result['face_box']
            student = detection_result['student']
            confidence = detection_result['confidence']
            
            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 3)  # Kotak hijau
            text = f"{student['name']} ({confidence:.1f}%)"
            
            # Text putih dengan border hitam (stroke effect)
            cv2.putText(frame, text, (x, y-30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 4)  # Border hitam (tebal)
            cv2.putText(frame, text, (x, y-30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)  # Text putih
            
            cv2.putText(frame, student['class'], (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 4)  # Border hitam
            cv2.putText(frame, student['class'], (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)  # Text putih
            
            status = "🎯 MEREKAM" if self.auto_detect_enabled else "✅ TERDETEKSI"
            self.update_detection_info(f"👤 {student['name']} | {status} ({confidence:.1f}%)")
        else:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = self.face_cascade.detectMultiScale(gray, 1.3, 5, minSize=(60, 60))
            
            for (x, y, w, h) in faces:
                cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 0, 255), 2)  # Kotak merah
                # Text putih dengan border hitam untuk unknown
                cv2.putText(frame, 'Tidak Dikenal', (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 4)  # Border hitam
                cv2.putText(frame, 'Tidak Dikenal', (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)  # Text putih
            
            if len(faces) == 0:
                self.update_detection_info("👀 Mencari wajah...")
            elif len(faces) > 1:
                self.update_detection_info("⚠️ Beberapa wajah terdeteksi")
            else:
                self.update_detection_info("❓ Wajah tidak dikenali")
        
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        img = Image.fromarray(frame_rgb)
        img = img.resize((800, 600))  # Update size for fullscreen
        photo = ImageTk.PhotoImage(image=img)
        
        self.camera_label.configure(image=photo, text="")
        self.camera_label.image = photo
    
    def handle_auto_attendance(self, detection_result):
        student = detection_result['student']
        student_id = student['id']
        current_time = time.time()
        
        if student_id in self.last_detection_time:
            time_since_last = current_time - self.last_detection_time[student_id]
            if time_since_last < self.detection_cooldown:
                return
        
        self.last_detection_time[student_id] = current_time
        self.record_attendance_auto(student, detection_result['confidence'])
    
    def record_attendance_auto(self, student_info, confidence):
        try:
            data = {
                'student_id': int(student_info['id']),
                'confidence': float(confidence)
            }
            
            response = requests.post(f"{self.api_base_url}/api/face-recognition/attendance",
                                   json=data, headers={'Content-Type': 'application/json'}, timeout=5)
           
            if response.status_code == 200:
                self.session_attendances += 1
                
                timestamp = time.strftime('%H:%M:%S')
                detection_text = f"✅ [{timestamp}] {student_info['name']} - {student_info['class']}\n"
                
                current_text = self.activity_log.get("0.0", "end")
                lines = current_text.strip().split('\n')
                if len(lines) >= 15:
                    lines = lines[:14]
                
                new_text = detection_text + '\n'.join(lines)
                self.activity_log.delete("0.0", "end")
                self.activity_log.insert("0.0", new_text)
                
                self.log_status(f"✅ {student_info['name']} - Kehadiran tercatat ({confidence:.1f}%)")
            else:
                self.log_status(f"❌ Gagal catat kehadiran: {student_info['name']}")
                
        except Exception as e:
            self.log_status(f"❌ Error kehadiran: {str(e)}")
    
    def update_session_stats(self):
        self.detections_label.configure(text=f"Deteksi: {self.session_detections}")
        self.attendance_label.configure(text=f"Kehadiran: {self.session_attendances}")
    
    def load_students_for_registration(self):
        try:
            self.log_status("📥 Memuat siswa untuk pendaftaran...")
            response = requests.get(f"{self.api_base_url}/api/face/students", timeout=10)
            
            if response.status_code == 200:
                self.all_students = response.json()
                
                student_values = []
                for student in self.all_students:
                    class_name = student.get('class', {}).get('name', 'Kelas Tidak Diketahui')
                    display_text = f"{student['name']} - {student['studentId']} - {class_name}"
                    student_values.append(display_text)
                
                self.student_dropdown.configure(values=student_values)
                
                info_text = f"📋 {len(self.all_students)} siswa dimuat.\n\nPilih siswa dari dropdown di atas."
                
                self.student_info_text.delete("0.0", "end")
                self.student_info_text.insert("0.0", info_text)
                
                self.log_status(f"✅ Memuat {len(self.all_students)} siswa")
                self.reg_status.configure(text="✅ Siswa dimuat - Pilih satu")
            else:
                self.log_status(f"❌ Gagal memuat siswa: {response.status_code}")
                
        except Exception as e:
            self.log_status(f"❌ Error memuat siswa: {str(e)}")
    
    def filter_students(self, event=None):
        search_term = self.search_entry.get().lower()
        if not search_term or not hasattr(self, 'all_students'):
            return
        
        filtered = []
        for student in self.all_students:
            student_text = f"{student['name']} {student['studentId']}"
            if hasattr(student, 'class') and student.get('class'):
                student_text += f" {student['class'].get('name', '')}"
            
            if search_term in student_text.lower():
                filtered.append(student)
        
        student_values = []
        for student in filtered:
            class_name = student.get('class', {}).get('name', 'Kelas Tidak Diketahui')
            display_text = f"{student['name']} - {student['studentId']} - {class_name}"
            student_values.append(display_text)
        
        self.student_dropdown.configure(values=student_values)
    
    def on_student_select(self, selected_value):
        if not selected_value or not hasattr(self, 'all_students'):
            return
        
        for student in self.all_students:
            class_name = student.get('class', {}).get('name', 'Kelas Tidak Diketahui')
            display_text = f"{student['name']} - {student['studentId']} - {class_name}"
            
            if display_text == selected_value:
                self.selected_student = student
                
                info_text = f"👤 Dipilih: {student['name']}\n"
                info_text += f"NIS: {student['studentId']}\n"
                info_text += f"Kelas: {class_name}\n\n"
                info_text += "✅ Siap untuk capture wajah."
                
                self.student_info_text.delete("0.0", "end")
                self.student_info_text.insert("0.0", info_text)
                
                self.reg_status.configure(text=f"✅ Dipilih: {student['name']}")
                self.log_status(f"👤 Dipilih: {student['name']}")
                break
    
    def start_reg_camera(self):
        self.reg_camera = cv2.VideoCapture(0)
        if not self.reg_camera.isOpened():
            messagebox.showerror("Error", "Tidak dapat membuka kamera")
            return
            
        self.is_reg_camera_running = True
        self.reg_start_btn.configure(state="disabled")
        self.reg_stop_btn.configure(state="normal")
        self.capture_btn.configure(state="normal")
        
        self.reg_camera_thread = threading.Thread(target=self.update_reg_camera)
        self.reg_camera_thread.daemon = True
        self.reg_camera_thread.start()
        
        self.reg_status.configure(text="📹 Kamera aktif - Posisikan wajah")
    
    def stop_reg_camera(self):
        self.is_reg_camera_running = False
        if self.reg_camera:
            self.reg_camera.release()
        
        self.reg_start_btn.configure(state="normal")
        self.reg_stop_btn.configure(state="disabled")
        self.capture_btn.configure(state="disabled")
        self.reg_status.configure(text="📹 Kamera dihentikan")
    
    def update_reg_camera(self):
        while self.is_reg_camera_running:
            try:
                ret, frame = self.reg_camera.read()
                if ret:
                    frame = cv2.flip(frame, 1)
                    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                    faces = self.face_cascade.detectMultiScale(gray, 1.3, 5, minSize=(60, 60))
                    
                    for (x, y, w, h) in faces:
                        cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
                        cv2.putText(frame, f'Siap ({len(faces)})', (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
                    
                    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    img = Image.fromarray(frame_rgb)
                    img = img.resize((300, 250))
                    photo = ImageTk.PhotoImage(image=img)
                    
                    self.reg_camera_label.configure(image=photo, text="")
                    self.reg_camera_label.image = photo
                
                time.sleep(0.03)
            except Exception:
                break
    
    def capture_for_registration(self):
        if not self.selected_student:
            messagebox.showerror("Error", "Silakan pilih siswa terlebih dahulu!")
            return
            
        if not self.reg_camera:
            messagebox.showerror("Error", "Kamera belum dimulai!")
            return
        
        ret, frame = self.reg_camera.read()
        if not ret:
            messagebox.showerror("Error", "Gagal capture frame")
            return
        
        face_template = self.extract_face_template(frame)
        
        if face_template is None:
            messagebox.showerror("Error", "Tidak ada wajah tunggal yang terdeteksi")
            return
        
        student_name = self.selected_student['name']
        result = messagebox.askyesno("Konfirmasi", f"Daftarkan wajah untuk {student_name}?")
        
        if result:
            self.register_student_face(face_template)
    
    def register_student_face(self, face_template):
        if not self.selected_student:
            messagebox.showerror("Error", "Tidak ada siswa yang dipilih!")
            return
            
        try:
            self.log_status(f"📝 Mendaftarkan {self.selected_student['name']}...")
            
            data = {
                'student_id': int(self.selected_student['id']),
                'face_descriptor': face_template.flatten().tolist()
            }
            
            response = requests.post(f"{self.api_base_url}/api/face-recognition/register", 
                                    json=data, headers={'Content-Type': 'application/json'}, timeout=15)
            
            if response.status_code == 200:
                student_name = self.selected_student['name']
                messagebox.showinfo("Sukses", f"Wajah berhasil didaftarkan untuk {student_name}!")
                self.reg_status.configure(text=f"✅ {student_name} terdaftar!")
                self.load_face_data()
                self.log_status(f"✅ Pendaftaran berhasil: {student_name}")
            else:
                messagebox.showerror("Error", "Pendaftaran gagal")
                self.log_status("❌ Pendaftaran gagal")
                
        except Exception as e:
            messagebox.showerror("Error", f"Error: {str(e)}")
            self.log_status(f"❌ Error pendaftaran: {str(e)}")
    
    def extract_face_template(self, frame):
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(gray, 1.3, 5, minSize=(60, 60))
       
        if len(faces) == 1:
            x, y, w, h = faces[0]
            face_roi = gray[y:y+h, x:x+w]
            face_template = cv2.resize(face_roi, (100, 100))
            return face_template
        
        return None
    
    def compare_faces_template(self, face_template):
        if len(self.face_templates) == 0:
            return None, 0
        
        best_match_idx = -1
        best_score = float('inf')
        
        for i, template in enumerate(self.face_templates):
            try:
                if template.shape == face_template.shape:
                    result = cv2.matchTemplate(face_template, template, cv2.TM_SQDIFF_NORMED)
                    score = result[0][0]
                    
                    if score < best_score and score < 0.3:
                        best_score = score
                        best_match_idx = i
            except Exception:
                continue
        
        if best_match_idx >= 0:
            confidence = (1 - best_score) * 100
            return self.known_faces[best_match_idx], confidence
        
        return None, 0
    
    def initialize_data(self):
        self.test_connection()
        self.load_students()
    
    def test_connection(self):
        try:
            self.log_status("🔄 Mengecek koneksi...")
            response = requests.get(f"{self.api_base_url}/api/face-recognition/data", timeout=5)
            
            if response.status_code == 200:
                self.connection_status.configure(text="🟢 Terhubung", text_color="green")
                self.log_status("✅ Server terhubung")
                self.load_face_data()
            else:
                self.connection_status.configure(text="🔴 Error", text_color="red")
                self.log_status(f"❌ Error server: {response.status_code}")
                
        except requests.exceptions.ConnectionError:
            self.connection_status.configure(text="🔴 Tidak Terhubung", text_color="red")
            self.log_status("❌ Tidak dapat terhubung ke server")
        except Exception as e:
            self.connection_status.configure(text="🔴 Gagal", text_color="red")
            self.log_status(f"❌ Error koneksi: {str(e)}")
    
    def load_face_data(self):
        try:
            self.log_status("📥 Memuat data wajah...")
            response = requests.get(f"{self.api_base_url}/api/face-recognition/data", timeout=10)
            
            if response.status_code == 200:
                try:
                    face_data = response.json()
                    self.log_status(f"📊 Memproses {len(face_data)} record wajah")
                    
                    self.known_faces = {}
                    self.face_templates = []
                    
                    for i, face in enumerate(face_data):
                        try:
                            face_array = np.array(face['descriptor'], dtype=np.uint8)
                            
                            if len(face_array.shape) == 1:
                                size = int(np.sqrt(len(face_array)))
                                if size * size == len(face_array):
                                    face_array = face_array.reshape(size, size)
                                else:
                                    face_array = face_array.reshape(100, -1)
                                    if face_array.shape[1] != 100:
                                        face_array = cv2.resize(face_array, (100, 100))
                            
                            student_info = {
                                'name': face['student']['name'],
                                'id': face['student']['id'],
                                'class': face['student'].get('class', {}).get('name', 'Tidak Diketahui')
                            }
                            
                            self.known_faces[len(self.face_templates)] = student_info
                            self.face_templates.append(face_array)
                            
                        except Exception as e:
                            self.log_status(f"⚠️ Error memproses wajah {i}: {str(e)}")
                            continue
                    
                    count = len(self.face_templates)
                    self.student_count_label.configure(text=f"Siswa: {count}")
                    self.log_status(f"✅ Memuat {count} template wajah")
                    self.update_detection_info("🎯 Siap untuk deteksi")
                    
                except json.JSONDecodeError as e:
                    self.log_status(f"❌ Error decode JSON: {str(e)}")
                    
            else:
                self.log_status(f"❌ Gagal memuat data wajah: {response.status_code}")
                self.update_detection_info("❌ Gagal memuat data")
                
        except requests.exceptions.ConnectionError:
            self.log_status("❌ Error koneksi saat memuat data wajah")
            self.update_detection_info("❌ Koneksi server gagal")
        except Exception as e:
            self.log_status(f"❌ Error memuat data wajah: {str(e)}")
            self.update_detection_info("❌ Error memuat data")
    
    def load_students(self):
        try:
            self.log_status("📥 Memuat siswa...")
            response = requests.get(f"{self.api_base_url}/api/face/students", timeout=10)
            
            if response.status_code == 200:
                self.all_students = response.json()
                self.log_status(f"✅ Memuat {len(self.all_students)} siswa")
            else:
                self.log_status(f"❌ Gagal memuat siswa: {response.status_code}")
                
        except Exception as e:
            self.log_status(f"❌ Error memuat siswa: {str(e)}")
    
    def log_status(self, message):
        if hasattr(self, 'status_log'):
            timestamp = time.strftime('%H:%M:%S')
            current_text = self.status_log.get("0.0", "end")
            lines = current_text.strip().split('\n')
            if len(lines) >= 20:
                lines = lines[:19]
            
            new_text = f"[{timestamp}] {message}\n" + '\n'.join(lines)
            self.status_log.delete("0.0", "end")
            self.status_log.insert("0.0", new_text)
        
        print(f"LOG: {message}")
    
    def update_detection_info(self, text):
        if hasattr(self, 'detection_info'):
            self.detection_info.configure(text=text)
    
    def update_status_bar(self, status):
        if hasattr(self, 'status_bar_label'):
            current_time = time.strftime("%H:%M:%S")
            self.status_bar_label.configure(text=f"{status} | {current_time}")
    def open_settings(self):
        settings_window = ctk.CTkToplevel(self.root)
        settings_window.title("Pengaturan Sistem")
        settings_window.geometry("600x700")
        settings_window.transient(self.root)
        settings_window.grab_set()
        
        ctk.CTkLabel(settings_window, text="⚙️ Pengaturan Sistem", font=ctk.CTkFont(size=20, weight="bold")).pack(pady=20)
        
        # Frame untuk pengaturan
        settings_frame = ctk.CTkScrollableFrame(settings_window, width=550, height=350)
        settings_frame.pack(pady=10, padx=25, fill="both", expand=True)
        
        # Pengaturan Deteksi
        ctk.CTkLabel(settings_frame, text="Pengaturan Deteksi", font=ctk.CTkFont(size=16, weight="bold")).pack(pady=(10, 5))
        
        confidence_frame = ctk.CTkFrame(settings_frame)
        confidence_frame.pack(fill="x", padx=10, pady=5)
        
        ctk.CTkLabel(confidence_frame, text="Threshold Confidence:").pack(side="left", padx=10, pady=10)
        self.confidence_slider = ctk.CTkSlider(confidence_frame, from_=50, to=95, number_of_steps=45)
        self.confidence_slider.set(self.detection_confidence_threshold)
        self.confidence_slider.pack(side="right", padx=10, pady=10)
        
        cooldown_frame = ctk.CTkFrame(settings_frame)
        cooldown_frame.pack(fill="x", padx=10, pady=5)
        
        ctk.CTkLabel(cooldown_frame, text="Cooldown Deteksi (detik):").pack(side="left", padx=10, pady=10)
        self.cooldown_entry = ctk.CTkEntry(cooldown_frame, width=80)
        self.cooldown_entry.insert(0, str(self.detection_cooldown))
        self.cooldown_entry.pack(side="right", padx=10, pady=10)
        
        # Pengaturan Server
        ctk.CTkLabel(settings_frame, text="Pengaturan Server", font=ctk.CTkFont(size=16, weight="bold")).pack(pady=(20, 5))
        
        server_frame = ctk.CTkFrame(settings_frame)
        server_frame.pack(fill="x", padx=10, pady=5)
        
        ctk.CTkLabel(server_frame, text="URL Server:").pack(anchor="w", padx=10, pady=(10, 5))
        self.server_entry = ctk.CTkEntry(server_frame, width=400)
        self.server_entry.insert(0, self.api_base_url)
        self.server_entry.pack(padx=10, pady=(0, 10))
        
        # Pengaturan Admin
        ctk.CTkLabel(settings_frame, text="Pengaturan Admin", font=ctk.CTkFont(size=16, weight="bold")).pack(pady=(20, 5))
        
        password_frame = ctk.CTkFrame(settings_frame)
        password_frame.pack(fill="x", padx=10, pady=5)
        
        ctk.CTkLabel(password_frame, text="Password Admin:").pack(anchor="w", padx=10, pady=(10, 5))
        self.password_entry = ctk.CTkEntry(password_frame, show="*", width=200)
        self.password_entry.insert(0, self.admin_password)
        self.password_entry.pack(padx=10, pady=(0, 10))
        
        # Pengaturan Tema
        ctk.CTkLabel(settings_frame, text="Pengaturan Tampilan", font=ctk.CTkFont(size=16, weight="bold")).pack(pady=(20, 5))
        
        theme_frame = ctk.CTkFrame(settings_frame)
        theme_frame.pack(fill="x", padx=10, pady=5)
        
        ctk.CTkLabel(theme_frame, text="Mode Tampilan:").pack(side="left", padx=10, pady=10)
        self.theme_var = ctk.StringVar(value=ctk.get_appearance_mode())
        theme_menu = ctk.CTkOptionMenu(theme_frame, variable=self.theme_var, values=["Light", "Dark", "System"])
        theme_menu.pack(side="right", padx=10, pady=10)
        
        # Tombol aksi
        button_frame = ctk.CTkFrame(settings_window)
        button_frame.pack(fill="x", padx=25, pady=10)
        
        ctk.CTkButton(button_frame, text="💾 Simpan", command=lambda: self.save_settings(settings_window), 
                    fg_color="green", hover_color="darkgreen").pack(side="left", padx=10, pady=10)
        
        ctk.CTkButton(button_frame, text="🔄 Reset", command=self.reset_settings, 
                    fg_color="orange", hover_color="darkorange").pack(side="left", padx=10, pady=10)
        
        ctk.CTkButton(button_frame, text="❌ Batal", command=settings_window.destroy, 
                    fg_color="red", hover_color="darkred").pack(side="right", padx=10, pady=10)

    def save_settings(self, window):
        try:
            # Simpan pengaturan
            self.detection_confidence_threshold = int(self.confidence_slider.get())
            self.detection_cooldown = int(self.cooldown_entry.get())
            self.api_base_url = self.server_entry.get()
            self.admin_password = self.password_entry.get()
            
            # Ubah tema
            ctk.set_appearance_mode(self.theme_var.get())
            
            self.log_status("✅ Pengaturan berhasil disimpan")
            messagebox.showinfo("Sukses", "Pengaturan berhasil disimpan!")
            window.destroy()
            
        except ValueError:
            messagebox.showerror("Error", "Nilai tidak valid! Periksa input numerik.")
        except Exception as e:
            messagebox.showerror("Error", f"Gagal menyimpan pengaturan: {str(e)}")

    def reset_settings(self):
        self.confidence_slider.set(75)
        self.cooldown_entry.delete(0, "end")
        self.cooldown_entry.insert(0, "10")
        self.server_entry.delete(0, "end")
        self.server_entry.insert(0, "http://localhost:3333")
        self.password_entry.delete(0, "end")
        self.password_entry.insert(0, "admin123")
        self.theme_var.set("Dark")
        self.log_status("🔄 Pengaturan direset ke default")
    def run(self):
        self.root.mainloop()

if __name__ == "__main__":
   app = SistemAbsensiModern()
   app.run()