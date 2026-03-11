import React, { useState, useEffect, useRef } from 'react';
import { Camera, Trash2, Image as ImageIcon, Sparkles, User, FileText, DollarSign, Hash, Phone, Calendar, Search, FileEdit, X, Wifi, WifiOff, Database, ChevronRight, ChevronLeft, Clock, Plus, Stethoscope, Users, UserCheck, ShoppingBag } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, serverTimestamp, setLogLevel } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD7OaWHuBJ69uNdT8g3S4F2FL7tkmdTwAo",
  authDomain: "florenza-clinic-db.firebaseapp.com",
  projectId: "florenza-clinic-db",
  storageBucket: "florenza-clinic-db.firebasestorage.app",
  messagingSenderId: "343590026459",
  appId: "1:343590026459:web:334f4ca1476f71cd3320fe",
  measurementId: "G-1YE8N1EBXS"
};

let app, auth, db;
const appId = 'florenza-clinic-db';

try {
  setLogLevel('silent');
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error("Firebase init error:", error);
}

const EMPTY_FORM = (today) => ({
  fullName: '', hn: '', phone: '',
  serviceDate: today,
  service: '', price: '', note: '',
  sale: '', assistant: '', appointedBy: '', doctor: ''
});

const getRecordImages = (record) => {
  const before = record.imagesBefore || [];
  const after = record.imagesAfter || [];
  if (before.length > 0 || after.length > 0) return [...before, ...after];
  return record.images || [];
};

const ImageUploadBlock = ({ type, existingImages, setExistingImages, newPreviews, onRemoveNew, onClickAdd, onLightbox }) => {
  const total = existingImages.length + newPreviews.length;
  const isBefore = type === 'before';
  const label = isBefore ? '🔴 ก่อนทำ' : '🟢 หลังทำ';
  const border = isBefore ? 'border-red-200' : 'border-green-200';
  const bg = isBefore ? 'bg-red-50/40' : 'bg-green-50/40';
  const badge = isBefore ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600';
  const addBtn = isBefore ? 'border-red-200 hover:bg-red-50' : 'border-green-200 hover:bg-green-50';
  return (
    <div className={`rounded-xl border-2 ${border} ${bg} p-3`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-slate-700">{label}</span>
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${badge}`}>{total}/5</span>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {existingImages.map((src, idx) => (
          <div key={`ex-${idx}`} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 group cursor-pointer"
            onClick={() => onLightbox([...existingImages, ...newPreviews], idx)}>
            <img src={src} alt="" className="w-full h-full object-cover" />
            <button type="button" onClick={ev => { ev.stopPropagation(); setExistingImages(p => p.filter((_, i) => i !== idx)); }}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-2.5 h-2.5" /></button>
            <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-[9px] text-white text-center py-0.5">เดิม</div>
          </div>
        ))}
        {newPreviews.map((src, idx) => (
          <div key={`nw-${idx}`} className="relative aspect-square rounded-lg overflow-hidden border-2 border-purple-300 group cursor-pointer"
            onClick={() => onLightbox([...existingImages, ...newPreviews], existingImages.length + idx)}>
            <img src={src} alt="" className="w-full h-full object-cover" />
            <button type="button" onClick={ev => { ev.stopPropagation(); onRemoveNew(type, idx); }}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-2.5 h-2.5" /></button>
            <div className="absolute bottom-0 left-0 right-0 bg-purple-500/70 text-[9px] text-white text-center py-0.5">ใหม่</div>
          </div>
        ))}
        {total < 5 && (
          <div onClick={onClickAdd}
            className={`aspect-square rounded-lg border-2 border-dashed ${addBtn} flex flex-col items-center justify-center cursor-pointer transition-colors`}>
            <Camera className="w-4 h-4 text-slate-400 mb-0.5" />
            <span className="text-[10px] text-slate-500 font-medium">เพิ่มรูป</span>
          </div>
        )}
      </div>
    </div>
  );
};

const StaffFields = ({ formData, handleInputChange, theme = 'purple' }) => {
  const ring = theme === 'blue' ? 'focus:border-blue-500 focus:ring focus:ring-blue-200 border-slate-200' : 'focus:border-purple-500 focus:ring focus:ring-purple-200 border-purple-200';
  const icon = theme === 'blue' ? 'text-blue-400' : 'text-purple-400';
  const label = theme === 'blue' ? 'text-slate-700' : 'text-purple-900';
  const head = theme === 'blue' ? 'text-blue-400' : 'text-purple-400';
  return (
    <div className="space-y-3">
      <h3 className={`text-xs font-bold ${head} uppercase tracking-wider border-b pb-1`}>ทีมผู้ดูแล</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={`block text-sm font-semibold ${label} mb-1`}>Sale <span className="text-red-500">*</span></label>
          <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><ShoppingBag className={`h-4 w-4 ${icon}`} /></div>
            <input type="text" name="sale" value={formData.sale} onChange={handleInputChange} required placeholder="ชื่อ Sale" className={`pl-10 w-full rounded-lg border ${ring} px-3 py-2 text-sm text-slate-700 bg-gray-50/50`} /></div>
        </div>
        <div>
          <label className={`block text-sm font-semibold ${label} mb-1`}>ผู้นัด</label>
          <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><UserCheck className={`h-4 w-4 ${icon}`} /></div>
            <input type="text" name="appointedBy" value={formData.appointedBy} onChange={handleInputChange} placeholder="ชื่อผู้นัด" className={`pl-10 w-full rounded-lg border ${ring} px-3 py-2 text-sm text-slate-700 bg-gray-50/50`} /></div>
        </div>
        <div>
          <label className={`block text-sm font-semibold ${label} mb-1`}>ผู้ช่วย <span className="text-red-500">*</span></label>
          <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Users className={`h-4 w-4 ${icon}`} /></div>
            <input type="text" name="assistant" value={formData.assistant} onChange={handleInputChange} required placeholder="ชื่อผู้ช่วย" className={`pl-10 w-full rounded-lg border ${ring} px-3 py-2 text-sm text-slate-700 bg-gray-50/50`} /></div>
        </div>
        <div>
          <label className={`block text-sm font-semibold ${label} mb-1`}>แพทย์ <span className="text-red-500">*</span></label>
          <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Stethoscope className={`h-4 w-4 ${icon}`} /></div>
            <input type="text" name="doctor" value={formData.doctor} onChange={handleInputChange} required placeholder="ชื่อแพทย์" className={`pl-10 w-full rounded-lg border ${ring} px-3 py-2 text-sm text-slate-700 bg-gray-50/50`} /></div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(true);
  const [dbStatus, setDbStatus] = useState('กำลังเชื่อมต่อ...');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('search');
  const [selectedPatientHN, setSelectedPatientHN] = useState(null);
  const [patientModalHN, setPatientModalHN] = useState(null);
  const [followUpCustomer, setFollowUpCustomer] = useState(null);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [alertMessage, setAlertMessage] = useState('');
  const [editingRecord, setEditingRecord] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const touchStartX = useRef(null);
  const fileBeforeRef = useRef(null);
  const fileAfterRef = useRef(null);

  const [beforeFiles, setBeforeFiles] = useState([]);
  const [beforePreviews, setBeforePreviews] = useState([]);
  const [afterFiles, setAfterFiles] = useState([]);
  const [afterPreviews, setAfterPreviews] = useState([]);
  const [editBeforeImages, setEditBeforeImages] = useState([]);
  const [editAfterImages, setEditAfterImages] = useState([]);

  const today = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState(EMPTY_FORM(today));

  useEffect(() => {
    const handleKey = (e) => {
      if (!lightbox) return;
      const total = lightbox.images.length;
      if (e.key === 'ArrowRight') setLightbox(lb => lb ? { ...lb, index: (lb.index + 1) % total } : null);
      if (e.key === 'ArrowLeft') setLightbox(lb => lb ? { ...lb, index: (lb.index - 1 + total) % total } : null);
      if (e.key === 'Escape') setLightbox(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightbox]);

  useEffect(() => {
    if (!auth) { setDbStatus('ไม่พบการตั้งค่า Firebase'); setLoading(false); return; }
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        setDbStatus('เชื่อมต่อ Auth ไม่สำเร็จ (โหมดออฟไลน์)');
        setAlertMessage(`ระบบไม่สามารถเชื่อมต่อการยืนยันตัวตนได้\nกรุณาเข้าไปที่ Firebase Console > Authentication เพื่อเปิดใช้งาน "Anonymous"\n\nรหัสข้อผิดพลาด: ${error.message}`);
        setIsOfflineMode(true); setLoading(false);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => { if (currentUser) setUser(currentUser); });
    return () => unsubscribe();
  }, []);

  const getMillis = (timestamp) => {
    if (!timestamp) return 0;
    if (timestamp.toMillis) return timestamp.toMillis();
    if (timestamp instanceof Date) return timestamp.getTime();
    if (typeof timestamp === 'number') return timestamp;
    return 0;
  };

  useEffect(() => {
    if (!user || !db) return;
    const recordsRef = collection(db, 'artifacts', appId, 'public', 'data', 'patient_records');
    const unsubscribe = onSnapshot(recordsRef, (snapshot) => {
      const fetchedRecords = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      fetchedRecords.sort((a, b) =>
        new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime() ||
        getMillis(b.createdAt) - getMillis(a.createdAt)
      );
      setRecords(fetchedRecords);
      setIsOfflineMode(false);
      setDbStatus('เชื่อมต่อฐานข้อมูลจริงสำเร็จ ✓');
      setLoading(false);
    }, (error) => {
      setIsOfflineMode(true);
      if (error.code === 'permission-denied') {
        setDbStatus('ติดสิทธิ์การเข้าถึง (Permission Denied)');
        setAlertMessage("ไม่สามารถเชื่อมต่อฐานข้อมูลได้ (Permission Denied)\n\nกรุณาเข้าไปที่ Firebase Console > Firestore Database > Rules\nและเปลี่ยนกฎเป็น:\n\nallow read, write: if true;");
      } else { setDbStatus('ทำงานแบบออฟไลน์'); }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (selectedPatientHN) {
      const exists = records.some(r => r.hn === selectedPatientHN);
      if (!exists) setSelectedPatientHN(null);
    }
  }, [records, selectedPatientHN]);

  const groupedPatientsMap = new Map();
  records.forEach(r => {
    if (!groupedPatientsMap.has(r.hn)) {
      groupedPatientsMap.set(r.hn, { hn: r.hn, fullName: r.fullName, phone: r.phone, latestDate: r.serviceDate, count: 1, records: [r] });
    } else {
      const p = groupedPatientsMap.get(r.hn);
      p.count += 1; p.records.push(r);
      if (new Date(r.serviceDate) > new Date(p.latestDate)) p.latestDate = r.serviceDate;
    }
  });
  const allPatients = Array.from(groupedPatientsMap.values());
  allPatients.sort((a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime());
  const filteredPatients = allPatients.filter(p => {
    const q = searchQuery.toLowerCase();
    return (p.fullName && p.fullName.toLowerCase().includes(q)) || (p.hn && p.hn.toLowerCase().includes(q)) || (p.phone && p.phone.includes(q));
  });
  const modalPatient = patientModalHN ? groupedPatientsMap.get(patientModalHN) : null;

  const compressImage = (file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 800; let w = img.width, h = img.height;
        if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX; } } else { if (h > MAX) { w *= MAX / h; h = MAX; } }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
    };
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageAdd = (e, type) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const validFiles = files.filter(f => f.type.startsWith('image/'));
    const currentCount = type === 'before'
      ? (editingRecord ? editBeforeImages.length : 0) + beforeFiles.length
      : (editingRecord ? editAfterImages.length : 0) + afterFiles.length;
    if (currentCount + validFiles.length > 5) { setAlertMessage('สามารถอัปโหลดได้สูงสุด 5 รูปต่อประเภท'); return; }
    if (type === 'before') {
      setBeforeFiles(prev => [...prev, ...validFiles]);
      validFiles.forEach(f => { const r = new FileReader(); r.onloadend = () => setBeforePreviews(prev => [...prev, r.result]); r.readAsDataURL(f); });
    } else {
      setAfterFiles(prev => [...prev, ...validFiles]);
      validFiles.forEach(f => { const r = new FileReader(); r.onloadend = () => setAfterPreviews(prev => [...prev, r.result]); r.readAsDataURL(f); });
    }
    e.target.value = '';
  };

  const removeNewImage = (type, index) => {
    if (type === 'before') { setBeforeFiles(p => p.filter((_, i) => i !== index)); setBeforePreviews(p => p.filter((_, i) => i !== index)); }
    else { setAfterFiles(p => p.filter((_, i) => i !== index)); setAfterPreviews(p => p.filter((_, i) => i !== index)); }
  };

  const resetImages = () => {
    setBeforeFiles([]); setBeforePreviews([]);
    setAfterFiles([]); setAfterPreviews([]);
    setEditBeforeImages([]); setEditAfterImages([]);
  };

  const staffRequired = !formData.sale || !formData.assistant || !formData.doctor;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.hn || !formData.service || !formData.serviceDate || staffRequired) return;
    setSubmitting(true);
    try {
      const b64Before = await Promise.all(beforeFiles.map(f => compressImage(f)));
      const b64After = await Promise.all(afterFiles.map(f => compressImage(f)));
      const newRecord = {
        fullName: formData.fullName, hn: formData.hn, phone: formData.phone || '',
        serviceDate: formData.serviceDate, service: formData.service,
        price: formData.price ? Number(formData.price) : null,
        note: formData.note || '',
        sale: formData.sale || '', assistant: formData.assistant || '',
        appointedBy: formData.appointedBy || '', doctor: formData.doctor || '',
        imagesBefore: b64Before, imagesAfter: b64After, images: [],
        createdBy: user?.uid || 'anonymous',
        createdAt: db && !isOfflineMode ? serverTimestamp() : new Date()
      };
      if (db && !isOfflineMode) {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'patient_records'), newRecord);
      } else {
        setAlertMessage("ขณะนี้ระบบทำงานในโหมดออฟไลน์ ข้อมูลจะไม่ได้ถูกส่งขึ้น Firebase ถาวร");
        setRecords(prev => [{ ...newRecord, id: 'local-' + Date.now(), createdAt: new Date() }, ...prev]);
      }
      const savedHN = formData.hn;
      setFormData(EMPTY_FORM(today)); resetImages();
      if (followUpCustomer) { setFollowUpCustomer(null); setActiveTab('search'); setSelectedPatientHN(savedHN); }
      else { setActiveTab('search'); }
    } catch (error) { setAlertMessage(`เกิดข้อผิดพลาด: ${error.message}`); }
    finally { setSubmitting(false); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.hn || !formData.service || !formData.serviceDate || staffRequired) return;
    setSubmitting(true);
    try {
      const b64Before = await Promise.all(beforeFiles.map(f => compressImage(f)));
      const b64After = await Promise.all(afterFiles.map(f => compressImage(f)));
      const updatedRecord = {
        fullName: formData.fullName, hn: formData.hn, phone: formData.phone || '',
        serviceDate: formData.serviceDate, service: formData.service,
        price: formData.price ? Number(formData.price) : null,
        note: formData.note || '',
        sale: formData.sale || '', assistant: formData.assistant || '',
        appointedBy: formData.appointedBy || '', doctor: formData.doctor || '',
        imagesBefore: [...editBeforeImages, ...b64Before],
        imagesAfter: [...editAfterImages, ...b64After],
        images: [],
      };
      if (db && !isOfflineMode) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'patient_records', editingRecord.id), updatedRecord);
      } else { setRecords(prev => prev.map(r => r.id === editingRecord.id ? { ...r, ...updatedRecord } : r)); }
      closeEditModal(); setAlertMessage("บันทึกการแก้ไขข้อมูลสำเร็จ ✓");
    } catch (error) { setAlertMessage("เกิดข้อผิดพลาดในการอัปเดตข้อมูล: " + error.message); }
    finally { setSubmitting(false); }
  };

  const handleDeleteClick = (id) => setRecordToDelete(id);

  const confirmDelete = async () => {
    if (!recordToDelete) return;
    try {
      if (String(recordToDelete).startsWith('local-') || isOfflineMode || !db) {
        setRecords(prev => prev.filter(r => r.id !== recordToDelete));
      } else { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'patient_records', recordToDelete)); }
    } catch (error) {
      if (error.code === 'permission-denied') setAlertMessage("ไม่สามารถลบข้อมูลได้เนื่องจากติดสิทธิ์ (Permission Denied) ใน Firebase");
    } finally { setRecordToDelete(null); }
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    setFormData({
      fullName: record.fullName, hn: record.hn, phone: record.phone || '',
      serviceDate: record.serviceDate, service: record.service,
      price: record.price || '', note: record.note || '',
      sale: record.sale || '', assistant: record.assistant || '',
      appointedBy: record.appointedBy || '', doctor: record.doctor || ''
    });
    setEditBeforeImages(record.imagesBefore || record.images || []);
    setEditAfterImages(record.imagesAfter || []);
    setBeforeFiles([]); setBeforePreviews([]);
    setAfterFiles([]); setAfterPreviews([]);
  };

  const closeEditModal = () => {
    setEditingRecord(null);
    setFormData(EMPTY_FORM(today));
    resetImages();
  };

  const handleAddFollowUp = (patient) => {
    setFollowUpCustomer({ fullName: patient.fullName, hn: patient.hn, phone: patient.phone || '' });
    setFormData({ ...EMPTY_FORM(today), fullName: patient.fullName, hn: patient.hn, phone: patient.phone || '' });
    resetImages();
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
  };
  const formatCurrency = (amount) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount);

  if (loading) {
    return (
      <div className="min-h-screen bg-purple-50 flex items-center justify-center">
        <div className="text-purple-600 flex flex-col items-center">
          <Sparkles className="w-10 h-10 mb-4 text-purple-500 animate-spin" />
          <p className="text-lg font-medium">กำลังโหลดระบบ Florenza Clinic...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF9FF] text-slate-800 font-sans pb-12">

      {isOfflineMode && (
        <div className="bg-red-500 text-white text-sm font-bold px-4 py-2 text-center">
          ⚠️ ข้อมูลไม่ได้ถูกจัดเก็บในฐานข้อมูลจริง (Offline Mode)
        </div>
      )}

      <header className="bg-gradient-to-r from-purple-800 to-purple-600 text-white shadow-lg sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white p-2 rounded-full shadow-md"><Database className="w-6 h-6 text-purple-600" /></div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight">Florenza Clinic</h1>
                <p className="text-purple-200 text-xs md:text-sm font-medium">ระบบจัดเก็บประวัติและรูปภาพลูกค้า</p>
              </div>
            </div>
            <div className={`hidden md:flex items-center px-3 py-1.5 rounded-full text-xs font-bold border ${isOfflineMode ? 'bg-red-500/20 text-red-100 border-red-400/30' : 'bg-green-500/20 text-green-100 border-green-400/30'}`}>
              {isOfflineMode ? <WifiOff className="w-3.5 h-3.5 mr-1.5" /> : <Wifi className="w-3.5 h-3.5 mr-1.5" />}
              {dbStatus}
            </div>
          </div>
        </div>
        <div className="bg-purple-900/30 border-t border-purple-500/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 overflow-x-auto">
            <button onClick={() => { setActiveTab('search'); setSelectedPatientHN(null); }} className={`py-3 px-5 font-medium text-sm transition-colors border-b-2 whitespace-nowrap flex items-center ${activeTab === 'search' ? 'border-white text-white bg-purple-600/50' : 'border-transparent text-purple-200 hover:text-white hover:bg-purple-600/30'}`}>
              <Search className="w-4 h-4 mr-2" /> ค้นหาประวัติลูกค้า
            </button>
            <button onClick={() => { setActiveTab('add'); setSelectedPatientHN(null); setFollowUpCustomer(null); }} className={`py-3 px-5 font-medium text-sm transition-colors border-b-2 whitespace-nowrap flex items-center ${activeTab === 'add' ? 'border-white text-white bg-purple-600/50' : 'border-transparent text-purple-200 hover:text-white hover:bg-purple-600/30'}`}>
              <FileEdit className="w-4 h-4 mr-2" /> + บันทึกประวัติใหม่
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <input type="file" ref={fileBeforeRef} onChange={e => handleImageAdd(e, 'before')} accept="image/*" multiple className="hidden" />
        <input type="file" ref={fileAfterRef} onChange={e => handleImageAdd(e, 'after')} accept="image/*" multiple className="hidden" />

        {/* ── Add New Record ── */}
        {activeTab === 'add' && (
          <div className="bg-white rounded-2xl shadow-xl border border-purple-100 overflow-hidden max-w-2xl mx-auto">
            <div className="bg-purple-50 border-b border-purple-100 px-6 py-4">
              <h2 className="text-lg font-bold text-purple-900 flex items-center"><FileEdit className="w-5 h-5 mr-2 text-purple-600" /> บันทึกประวัติใหม่</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider border-b pb-1">ข้อมูลลูกค้า</h3>
                <div>
                  <label className="block text-sm font-semibold text-purple-900 mb-1">ชื่อ-นามสกุล <span className="text-red-500">*</span></label>
                  <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-4 w-4 text-purple-400" /></div>
                    <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} required placeholder="เช่น สมหญิง สวยงาม" className="pl-10 w-full rounded-lg border border-purple-200 focus:border-purple-500 focus:ring focus:ring-purple-200 px-3 py-2 text-sm text-slate-700 bg-gray-50/50" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-purple-900 mb-1">เลข HN <span className="text-red-500">*</span></label>
                    <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Hash className="h-4 w-4 text-purple-400" /></div>
                      <input type="text" name="hn" value={formData.hn} onChange={handleInputChange} required placeholder="HN12345" className="pl-10 w-full rounded-lg border border-purple-200 focus:border-purple-500 focus:ring focus:ring-purple-200 px-3 py-2 text-sm text-slate-700 bg-gray-50/50" /></div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-purple-900 mb-1">เบอร์โทรศัพท์</label>
                    <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Phone className="h-4 w-4 text-purple-400" /></div>
                      <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="08X-XXX-XXXX" className="pl-10 w-full rounded-lg border border-purple-200 focus:border-purple-500 focus:ring focus:ring-purple-200 px-3 py-2 text-sm text-slate-700 bg-gray-50/50" /></div>
                  </div>
                </div>
              </div>
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider border-b pb-1">ข้อมูลเข้ารับบริการ</h3>
                <div>
                  <label className="block text-sm font-semibold text-purple-900 mb-1">วันที่เข้ารับบริการ <span className="text-red-500">*</span></label>
                  <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Calendar className="h-4 w-4 text-purple-400" /></div>
                    <input type="date" name="serviceDate" value={formData.serviceDate} onChange={handleInputChange} required className="pl-10 w-full rounded-lg border border-purple-200 focus:border-purple-500 focus:ring focus:ring-purple-200 px-3 py-2 text-sm text-slate-700 bg-gray-50/50" /></div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-purple-900 mb-1">รายการหัตถการ <span className="text-red-500">*</span></label>
                  <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FileText className="h-4 w-4 text-purple-400" /></div>
                    <input type="text" name="service" value={formData.service} onChange={handleInputChange} required placeholder="เช่น ฉีดโบท็อกซ์กราม, ฟิลเลอร์คาง" className="pl-10 w-full rounded-lg border border-purple-200 focus:border-purple-500 focus:ring focus:ring-purple-200 px-3 py-2 text-sm text-slate-700 bg-gray-50/50" /></div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-purple-900 mb-1">ราคา (บาท)</label>
                  <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><DollarSign className="h-4 w-4 text-purple-400" /></div>
                    <input type="number" name="price" value={formData.price} onChange={handleInputChange} min="0" placeholder="ไม่ระบุ" className="pl-10 w-full rounded-lg border border-purple-200 focus:border-purple-500 focus:ring focus:ring-purple-200 px-3 py-2 text-sm text-slate-700 bg-gray-50/50" /></div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-purple-900 mb-1">หมายเหตุเพิ่มเติม</label>
                  <textarea name="note" value={formData.note} onChange={handleInputChange} rows="2" placeholder="เช่น ลูกค้าแพ้ยาชา, มัดจำแล้ว..." className="w-full rounded-lg border border-purple-200 focus:border-purple-500 focus:ring focus:ring-purple-200 px-3 py-2 text-sm text-slate-700 bg-gray-50/50 resize-none" />
                </div>
              </div>
              <StaffFields theme="purple" formData={formData} handleInputChange={handleInputChange} />
              <div className="pt-2">
                <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider border-b pb-1 mb-3">รูปภาพก่อน / หลังทำ</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ImageUploadBlock type="before" existingImages={[]} setExistingImages={() => {}} newPreviews={beforePreviews} onRemoveNew={removeNewImage} onClickAdd={() => fileBeforeRef.current?.click()} onLightbox={(imgs, idx) => setLightbox({ images: imgs, index: idx })} />
                  <ImageUploadBlock type="after" existingImages={[]} setExistingImages={() => {}} newPreviews={afterPreviews} onRemoveNew={removeNewImage} onClickAdd={() => fileAfterRef.current?.click()} onLightbox={(imgs, idx) => setLightbox({ images: imgs, index: idx })} />
                </div>
              </div>
              <button type="submit" disabled={submitting || !formData.fullName || !formData.hn || !formData.service || !formData.serviceDate || staffRequired}
                className={`w-full py-3 px-4 mt-2 rounded-xl text-white font-bold shadow-md transition-all flex justify-center items-center ${(submitting || !formData.fullName || !formData.hn || !formData.service || !formData.serviceDate || staffRequired) ? 'bg-purple-300 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 hover:shadow-lg active:scale-[0.98]'}`}>
                {submitting ? <><Sparkles className="animate-spin w-5 h-5 mr-2" /> กำลังส่งข้อมูล...</> : 'บันทึกประวัติ'}
              </button>
            </form>
          </div>
        )}

        {/* ── Search & List ── */}
        {activeTab === 'search' && !selectedPatientHN && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-purple-100 mb-6">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Search className="h-5 w-5 text-purple-400" /></div>
                <input type="text" placeholder="ค้นหาลูกค้าด้วย ชื่อ, เบอร์โทรศัพท์ หรือ รหัส HN..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-12 w-full rounded-xl border border-purple-100 bg-purple-50/50 focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all px-4 py-3.5 text-slate-700" />
                {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-4 flex items-center text-purple-400 hover:text-purple-600"><X className="h-5 w-5 bg-purple-100 rounded-full p-0.5" /></button>}
              </div>
            </div>
            <div className="mb-5 flex items-center justify-between px-1">
              <h2 className="text-xl font-bold text-purple-900">{searchQuery ? 'ผลการค้นหา' : 'รายชื่อลูกค้าทั้งหมด'}</h2>
              <span className="bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1 rounded-full border border-purple-200">{filteredPatients.length} ท่าน</span>
            </div>
            {filteredPatients.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-purple-200 p-12 text-center shadow-sm">
                <div className="bg-purple-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"><User className="w-10 h-10 text-purple-300" /></div>
                <h3 className="text-lg font-bold text-purple-800 mb-1">{searchQuery ? 'ไม่พบชื่อลูกค้ารายนี้' : 'ยังไม่มีข้อมูลลูกค้า'}</h3>
                <p className="text-purple-500 text-sm">{searchQuery ? 'ลองเปลี่ยนคำค้นหา' : 'กดแท็บ "+ บันทึกประวัติใหม่" เพื่อเพิ่มข้อมูลลูกค้าคนแรก'}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredPatients.map((patient) => {
                  const totalSpend = patient.records.reduce((sum, r) => sum + (r.price || 0), 0);
                  const totalImages = patient.records.reduce((sum, r) => sum + getRecordImages(r).length, 0);
                  return (
                    <div key={patient.hn} onClick={() => setPatientModalHN(patient.hn)} className="bg-white rounded-2xl border border-slate-100 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer active:scale-[0.99] group">
                      <div className="px-4 py-3.5 flex items-center gap-3">
                        <div className="w-11 h-11 bg-purple-50 group-hover:bg-purple-600 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 border border-purple-100">
                          <User className="w-5 h-5 text-purple-400 group-hover:text-white transition-colors" />
                        </div>
                        <div className="flex-grow min-w-0">
                          <h3 className="text-sm font-bold text-slate-800 group-hover:text-purple-700 transition-colors truncate">{patient.fullName}</h3>
                          <div className="flex flex-wrap items-center gap-x-2 mt-0.5">
                            <span className="flex items-center text-[11px] text-slate-400 font-medium"><Hash className="w-2.5 h-2.5 mr-0.5 text-purple-300" />{patient.hn}</span>
                            {patient.phone && (<><span className="text-slate-200">·</span><span className="flex items-center text-[11px] text-slate-400 font-medium"><Phone className="w-2.5 h-2.5 mr-0.5 text-purple-300" />{patient.phone}</span></>)}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          {totalSpend > 0 ? <p className="text-base font-bold text-green-600 leading-tight">{formatCurrency(totalSpend)}</p> : <p className="text-xs text-slate-300 font-medium">-</p>}
                          <div className="flex items-center justify-end gap-1 mt-0.5">
                            <span className="text-[11px] text-slate-400">{patient.count} ครั้ง</span>
                            {totalImages > 0 && (<><span className="text-slate-200">·</span><ImageIcon className="w-2.5 h-2.5 text-purple-300" /><span className="text-[11px] text-slate-400">{totalImages}</span></>)}
                            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-purple-500 transition-colors ml-0.5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Patient Modal ── */}
        {patientModalHN && modalPatient && (() => {
          const allSortedRecords = [...modalPatient.records].sort((a, b) => new Date(b.serviceDate) - new Date(a.serviceDate));
          const allBefore = allSortedRecords.flatMap(r => (r.imagesBefore || r.images || []).map(src => ({ src, record: r })));
          const allAfter = allSortedRecords.flatMap(r => (r.imagesAfter || []).map(src => ({ src, record: r })));
          const totalSpend = modalPatient.records.reduce((sum, r) => sum + (r.price || 0), 0);
          const totalImages = allBefore.length + allAfter.length;

          const CarouselRow = ({ items, label, labelColor }) => items.length === 0 ? null : (
            <div className="mb-2">
              <p className={`text-[11px] font-bold uppercase tracking-wider mb-1.5 ${labelColor}`}>{label} · {items.length} รูป</p>
              <div className="flex gap-1.5 overflow-x-auto pb-1 snap-x snap-mandatory scroll-smooth" style={{ scrollbarWidth: 'none' }}>
                {items.map(({ src, record }, i) => (
                  <div key={i} className="relative shrink-0 w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden cursor-pointer group/thumb bg-slate-100 snap-start"
                    onClick={() => setLightbox({ images: items.map(x => x.src), index: i })}>
                    <img src={src} alt="" className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-300" loading="lazy" />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 py-1">
                      <p className="text-white text-[9px] font-semibold truncate">{formatDisplayDate(record.serviceDate)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );

          return (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center" onClick={() => setPatientModalHN(null)}>
              <div className="bg-[#f8f7fc] w-full sm:max-w-3xl sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden" style={{ maxHeight: '92vh' }} onClick={e => e.stopPropagation()}>
                <div className="bg-gradient-to-br from-purple-900 via-purple-700 to-purple-500 px-5 pt-5 pb-4 shrink-0">
                  <div className="w-10 h-1 bg-white/30 rounded-full mx-auto mb-4 sm:hidden" />
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center border border-white/20 shrink-0"><User className="w-7 h-7 text-white" /></div>
                      <div>
                        <h2 className="text-xl font-bold text-white leading-tight">{modalPatient.fullName}</h2>
                        <div className="flex flex-wrap items-center gap-x-3 mt-0.5">
                          <span className="flex items-center text-purple-200 text-xs font-medium"><Hash className="w-3 h-3 mr-0.5" />{modalPatient.hn}</span>
                          {modalPatient.phone && <span className="flex items-center text-purple-200 text-xs font-medium"><Phone className="w-3 h-3 mr-0.5" />{modalPatient.phone}</span>}
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="bg-white/15 text-white text-xs font-semibold px-2.5 py-1 rounded-lg">{modalPatient.count} ครั้ง</span>
                          {totalSpend > 0 && <span className="bg-green-400/20 text-green-200 text-xs font-bold px-2.5 py-1 rounded-lg border border-green-400/20">รวม {formatCurrency(totalSpend)}</span>}
                          {totalImages > 0 && <span className="bg-white/15 text-white text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center"><ImageIcon className="w-3 h-3 mr-1" />{totalImages} รูป</span>}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setPatientModalHN(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors shrink-0"><X className="w-5 h-5 text-white" /></button>
                  </div>
                  <button onClick={() => { handleAddFollowUp(modalPatient); setPatientModalHN(null); }} className="w-full mt-3 bg-white text-purple-700 hover:bg-purple-50 text-sm font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center shadow-sm">
                    <Plus className="w-4 h-4 mr-2" /> เพิ่มประวัติหัตถการใหม่
                  </button>
                </div>
                <div className="overflow-y-auto flex-grow">
                  {(allBefore.length > 0 || allAfter.length > 0) && (
                    <div className="p-4 pb-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center"><ImageIcon className="w-3.5 h-3.5 mr-1.5 text-purple-400" />คลังรูปภาพทั้งหมด</p>
                      <CarouselRow items={allBefore} label="🔴 ก่อนทำ" labelColor="text-red-500" />
                      <CarouselRow items={allAfter} label="🟢 หลังทำ" labelColor="text-green-600" />
                    </div>
                  )}
                  <div className="px-4 pt-3 pb-5">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center"><Clock className="w-3.5 h-3.5 mr-1.5 text-purple-400" />ประวัติการรับบริการ · {modalPatient.count} ครั้ง</p>
                    <div className="space-y-2">
                      {allSortedRecords.map((record, idx) => {
                        const recBefore = record.imagesBefore || record.images || [];
                        const recAfter = record.imagesAfter || [];
                        const allRecImages = [...recBefore, ...recAfter];
                        const thumb = allRecImages[0] || null;
                        return (
                          <div key={record.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="flex items-start gap-3 px-4 py-3">
                              {thumb ? (
                                <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 cursor-pointer relative group/mini" onClick={() => setLightbox({ images: allRecImages, index: 0 })}>
                                  <img src={thumb} alt="" className="w-full h-full object-cover group-hover/mini:scale-110 transition-transform duration-200" />
                                  {allRecImages.length > 1 && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><span className="text-white text-[10px] font-bold">+{allRecImages.length - 1}</span></div>}
                                </div>
                              ) : (
                                <div className="w-14 h-14 rounded-xl bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100"><ImageIcon className="w-5 h-5 text-purple-200" /></div>
                              )}
                              <div className="flex-grow min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                      {idx === 0 && <span className="bg-purple-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0">ล่าสุด</span>}
                                      <span className="text-[11px] text-slate-400 font-medium flex items-center"><Calendar className="w-2.5 h-2.5 mr-0.5 text-purple-300" />{formatDisplayDate(record.serviceDate)}</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-800 leading-snug truncate">{record.service}</p>
                                    {record.note && <p className="text-[11px] text-slate-400 mt-0.5 truncate">📝 {record.note}</p>}
                                    {(recBefore.length > 0 || recAfter.length > 0) && (
                                      <div className="flex gap-1.5 mt-1">
                                        {recBefore.length > 0 && <span className="text-[10px] font-bold bg-red-50 text-red-500 border border-red-200 px-1.5 py-0.5 rounded-md">🔴 ก่อน {recBefore.length}</span>}
                                        {recAfter.length > 0 && <span className="text-[10px] font-bold bg-green-50 text-green-600 border border-green-200 px-1.5 py-0.5 rounded-md">🟢 หลัง {recAfter.length}</span>}
                                      </div>
                                    )}
                                    {(record.doctor || record.sale || record.assistant || record.appointedBy) && (
                                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                                        {record.doctor && <span className="flex items-center text-[11px] text-slate-500"><Stethoscope className="w-2.5 h-2.5 mr-0.5 text-purple-400" />{record.doctor}</span>}
                                        {record.sale && <span className="flex items-center text-[11px] text-slate-500"><ShoppingBag className="w-2.5 h-2.5 mr-0.5 text-purple-400" />{record.sale}</span>}
                                        {record.assistant && <span className="flex items-center text-[11px] text-slate-500"><Users className="w-2.5 h-2.5 mr-0.5 text-purple-400" />{record.assistant}</span>}
                                        {record.appointedBy && <span className="flex items-center text-[11px] text-slate-500"><UserCheck className="w-2.5 h-2.5 mr-0.5 text-purple-400" />{record.appointedBy}</span>}
                                      </div>
                                    )}
                                  </div>
                                  <div className="shrink-0 text-right">
                                    {record.price && <p className="text-sm font-bold text-green-700">{formatCurrency(record.price)}</p>}
                                    <div className="flex items-center justify-end gap-0.5 mt-1">
                                      <button onClick={() => { openEditModal(record); setPatientModalHN(null); }} className="p-1.5 text-slate-300 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"><FileEdit className="w-3.5 h-3.5" /></button>
                                      <button onClick={() => { handleDeleteClick(record.id); setPatientModalHN(null); }} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── Follow Up Modal ── */}
        {followUpCustomer && (
          <div className="fixed inset-0 bg-purple-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 pt-10">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
              <div className="bg-gradient-to-r from-purple-700 to-purple-500 px-6 py-4 flex items-center justify-between text-white shrink-0 rounded-t-2xl">
                <h2 className="text-lg font-bold flex items-center"><FileEdit className="w-5 h-5 mr-2 text-purple-200" /> เพิ่มข้อมูลหัตถการใหม่</h2>
                <button onClick={() => setFollowUpCustomer(null)} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="overflow-y-auto p-6 flex-grow">
                <div className="bg-purple-50 rounded-xl p-4 mb-5 border border-purple-100">
                  <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">ข้อมูลลูกค้า</p>
                  <div className="flex flex-wrap gap-y-1.5 gap-x-5">
                    <div className="flex items-center text-purple-900"><User className="w-4 h-4 mr-1.5 text-purple-500" /><span className="font-bold text-sm">{followUpCustomer.fullName}</span></div>
                    <div className="flex items-center text-slate-600"><Hash className="w-4 h-4 mr-1.5 text-purple-400" /><span className="text-sm">{followUpCustomer.hn}</span></div>
                    {followUpCustomer.phone && <div className="flex items-center text-slate-600"><Phone className="w-4 h-4 mr-1.5 text-purple-400" /><span className="text-sm">{followUpCustomer.phone}</span></div>}
                  </div>
                </div>
                <form id="followUpForm" onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-purple-900 mb-1">วันที่เข้ารับบริการ <span className="text-red-500">*</span></label>
                    <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Calendar className="h-4 w-4 text-purple-400" /></div>
                      <input type="date" name="serviceDate" value={formData.serviceDate} onChange={handleInputChange} required className="pl-10 w-full rounded-lg border border-purple-200 focus:border-purple-500 focus:ring focus:ring-purple-200 px-3 py-2 text-sm text-slate-700 bg-gray-50/50" /></div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-purple-900 mb-1">รายการหัตถการ <span className="text-red-500">*</span></label>
                    <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FileText className="h-4 w-4 text-purple-400" /></div>
                      <input type="text" name="service" value={formData.service} onChange={handleInputChange} required placeholder="เช่น ฉีดโบท็อกซ์กราม" className="pl-10 w-full rounded-lg border border-purple-200 focus:border-purple-500 focus:ring focus:ring-purple-200 px-3 py-2 text-sm text-slate-700 bg-gray-50/50" /></div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-purple-900 mb-1">ราคา (บาท)</label>
                    <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><DollarSign className="h-4 w-4 text-purple-400" /></div>
                      <input type="number" name="price" value={formData.price} onChange={handleInputChange} min="0" placeholder="ไม่ระบุ" className="pl-10 w-full rounded-lg border border-purple-200 focus:border-purple-500 focus:ring focus:ring-purple-200 px-3 py-2 text-sm text-slate-700 bg-gray-50/50" /></div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-purple-900 mb-1">หมายเหตุเพิ่มเติม</label>
                    <textarea name="note" value={formData.note} onChange={handleInputChange} rows="2" className="w-full rounded-lg border border-purple-200 focus:border-purple-500 focus:ring focus:ring-purple-200 px-3 py-2 text-sm text-slate-700 bg-gray-50/50 resize-none" />
                  </div>
                  <StaffFields theme="purple" formData={formData} handleInputChange={handleInputChange} />
                  <div>
                    <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider border-b pb-1 mb-3">รูปภาพก่อน / หลังทำ</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <ImageUploadBlock type="before" existingImages={[]} setExistingImages={() => {}} newPreviews={beforePreviews} onRemoveNew={removeNewImage} onClickAdd={() => fileBeforeRef.current?.click()} onLightbox={(imgs, idx) => setLightbox({ images: imgs, index: idx })} />
                      <ImageUploadBlock type="after" existingImages={[]} setExistingImages={() => {}} newPreviews={afterPreviews} onRemoveNew={removeNewImage} onClickAdd={() => fileAfterRef.current?.click()} onLightbox={(imgs, idx) => setLightbox({ images: imgs, index: idx })} />
                    </div>
                  </div>
                </form>
              </div>
              <div className="border-t border-purple-100 p-4 bg-gray-50 flex justify-end gap-3 shrink-0 rounded-b-2xl">
                <button type="button" onClick={() => setFollowUpCustomer(null)} className="px-5 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-200 transition-colors">ยกเลิก</button>
                <button type="submit" form="followUpForm" disabled={submitting || !formData.service || !formData.serviceDate || staffRequired}
                  className={`px-6 py-2.5 rounded-xl text-white font-bold shadow-md transition-all flex items-center ${(submitting || !formData.service || !formData.serviceDate || staffRequired) ? 'bg-purple-300 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:shadow-lg active:scale-[0.98]'}`}>
                  {submitting ? <><Sparkles className="animate-spin w-5 h-5 mr-2" /> กำลังส่งข้อมูล...</> : 'บันทึกประวัติ'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Edit Modal ── */}
        {editingRecord && (
          <div className="fixed inset-0 bg-purple-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 pt-10">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
              <div className="bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-4 flex items-center justify-between text-white shrink-0 rounded-t-2xl">
                <h2 className="text-lg font-bold flex items-center"><FileEdit className="w-5 h-5 mr-2 text-blue-200" /> แก้ไขประวัติหัตถการ</h2>
                <button onClick={closeEditModal} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="overflow-y-auto p-6 flex-grow">
                <form id="editRecordForm" onSubmit={handleUpdate} className="space-y-4">
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider border-b pb-1">รายละเอียดหัตถการ</h3>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">วันที่เข้ารับบริการ <span className="text-red-500">*</span></label>
                      <input type="date" name="serviceDate" value={formData.serviceDate} onChange={handleInputChange} required className="w-full rounded-lg border border-slate-200 focus:border-blue-500 focus:ring focus:ring-blue-200 px-3 py-2 text-sm text-slate-700 bg-gray-50/50" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">รายการหัตถการ <span className="text-red-500">*</span></label>
                      <input type="text" name="service" value={formData.service} onChange={handleInputChange} required className="w-full rounded-lg border border-slate-200 focus:border-blue-500 focus:ring focus:ring-blue-200 px-3 py-2 text-sm text-slate-700 bg-gray-50/50" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">ราคา (บาท)</label>
                      <input type="number" name="price" value={formData.price} onChange={handleInputChange} min="0" className="w-full rounded-lg border border-slate-200 focus:border-blue-500 focus:ring focus:ring-blue-200 px-3 py-2 text-sm text-slate-700 bg-gray-50/50" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">หมายเหตุเพิ่มเติม</label>
                      <textarea name="note" value={formData.note} onChange={handleInputChange} rows="2" className="w-full rounded-lg border border-slate-200 focus:border-blue-500 focus:ring focus:ring-blue-200 px-3 py-2 text-sm text-slate-700 bg-gray-50/50 resize-none" />
                    </div>
                  </div>
                  <StaffFields theme="blue" formData={formData} handleInputChange={handleInputChange} />
                  <div>
                    <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider border-b pb-1 mb-3">รูปภาพก่อน / หลังทำ</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <ImageUploadBlock type="before" existingImages={editBeforeImages} setExistingImages={setEditBeforeImages} newPreviews={beforePreviews} onRemoveNew={removeNewImage} onClickAdd={() => fileBeforeRef.current?.click()} onLightbox={(imgs, idx) => setLightbox({ images: imgs, index: idx })} />
                      <ImageUploadBlock type="after" existingImages={editAfterImages} setExistingImages={setEditAfterImages} newPreviews={afterPreviews} onRemoveNew={removeNewImage} onClickAdd={() => fileAfterRef.current?.click()} onLightbox={(imgs, idx) => setLightbox({ images: imgs, index: idx })} />
                    </div>
                  </div>
                </form>
              </div>
              <div className="border-t border-slate-100 p-4 bg-gray-50 flex justify-end gap-3 shrink-0 rounded-b-2xl">
                <button type="button" onClick={closeEditModal} className="px-5 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-200 transition-colors">ยกเลิก</button>
                <button type="submit" form="editRecordForm" disabled={submitting || !formData.service || !formData.serviceDate || staffRequired}
                  className={`px-6 py-2.5 rounded-xl text-white font-bold shadow-md transition-all flex items-center ${(submitting || !formData.service || !formData.serviceDate || staffRequired) ? 'bg-blue-300 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:shadow-lg active:scale-[0.98]'}`}>
                  {submitting ? <><Sparkles className="animate-spin w-5 h-5 mr-2" /> กำลังบันทึก...</> : 'บันทึกการแก้ไข'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Lightbox ── */}
        {lightbox && (() => {
          const { images, index } = lightbox;
          const total = images.length;
          const goPrev = (e) => { e.stopPropagation(); setLightbox(lb => ({ ...lb, index: (lb.index - 1 + total) % total })); };
          const goNext = (e) => { e.stopPropagation(); setLightbox(lb => ({ ...lb, index: (lb.index + 1) % total })); };
          return (
            <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[100] flex items-center justify-center"
              onClick={() => setLightbox(null)}
              onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
              onTouchEnd={e => {
                if (touchStartX.current === null) return;
                const diff = touchStartX.current - e.changedTouches[0].clientX;
                if (Math.abs(diff) > 40) { diff > 0 ? setLightbox(lb => ({ ...lb, index: (lb.index + 1) % total })) : setLightbox(lb => ({ ...lb, index: (lb.index - 1 + total) % total })); }
                touchStartX.current = null;
              }}>
              <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 z-10"><X className="w-7 h-7" /></button>
              {total > 1 && <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs font-bold px-3 py-1.5 rounded-full z-10">{index + 1} / {total}</div>}
              {total > 1 && <button onClick={goPrev} className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white rounded-full p-2.5 sm:p-3 z-10 backdrop-blur-sm"><ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" /></button>}
              <img key={index} src={images[index]} alt={`รูป ${index + 1}`} className="max-w-[85vw] max-h-[85vh] object-contain rounded-lg shadow-2xl select-none" style={{ animation: 'fadeIn 0.18s ease' }} onClick={e => e.stopPropagation()} draggable={false} />
              {total > 1 && <button onClick={goNext} className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white rounded-full p-2.5 sm:p-3 z-10 backdrop-blur-sm"><ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" /></button>}
              {total > 1 && total <= 10 && (
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {images.map((_, i) => <button key={i} onClick={e => { e.stopPropagation(); setLightbox(lb => ({ ...lb, index: i })); }} className={`w-1.5 h-1.5 rounded-full transition-all ${i === index ? 'bg-white scale-125' : 'bg-white/40'}`} />)}
                </div>
              )}
              <style>{`@keyframes fadeIn { from { opacity: 0.4; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }`}</style>
            </div>
          );
        })()}

        {/* ── Confirm Delete ── */}
        {recordToDelete && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 className="w-8 h-8" /></div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">ยืนยันการลบข้อมูล</h3>
              <p className="text-slate-500 text-sm mb-6">คุณแน่ใจหรือไม่ว่าต้องการลบประวัตินี้? ข้อมูลที่ลบแล้วจะไม่สามารถกู้คืนได้</p>
              <div className="flex gap-3">
                <button onClick={() => setRecordToDelete(null)} className="flex-1 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">ยกเลิก</button>
                <button onClick={confirmDelete} className="flex-1 py-2.5 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-md">ลบข้อมูล</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Alert ── */}
        {alertMessage && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
              <div className="w-16 h-16 bg-purple-100 text-purple-500 rounded-full flex items-center justify-center mx-auto mb-4"><Sparkles className="w-8 h-8" /></div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">แจ้งเตือนจากระบบ</h3>
              <p className="text-slate-600 text-sm mb-6 whitespace-pre-line">{alertMessage}</p>
              <button onClick={() => setAlertMessage('')} className="w-full py-2.5 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-md">ตกลงเข้าใจแล้ว</button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
