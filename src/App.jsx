import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera, Trash2, Image as ImageIcon, Sparkles, User, FileText,
  DollarSign, Hash, Phone, Calendar, Search, FileEdit, X, Wifi,
  WifiOff, Database, ChevronRight, ChevronLeft, Clock, Plus,
  Stethoscope, Users, UserCheck, ShoppingBag, LayoutDashboard,
  CalendarCheck, PhoneCall, PhoneMissed, PhoneIncoming, PhoneOff,
  CheckCircle, UserX, XCircle, BarChart3, CalendarDays, Activity,
  Save, Ban, AlertTriangle, CalendarPlus, RefreshCw, UsersRound,
  ChevronDown, Bell, BookOpen, Grid, List, Star, UserPlus, Crown,
  Award, Shield, Gem, BadgeCheck
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import {
  getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc,
  updateDoc, serverTimestamp, setLogLevel, query
} from 'firebase/firestore';

// ─── Firebase ───────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyD7OaWHuBJ69uNdT8g3S4F2FL7tkmdTwAo",
  authDomain: "florenza-clinic-db.firebaseapp.com",
  projectId: "florenza-clinic-db",
  storageBucket: "florenza-clinic-db.firebasestorage.app",
  messagingSenderId: "343590026459",
  appId: "1:343590026459:web:334f4ca1476f71cd3320fe",
};
const APP_ID = 'florenza-clinic-db';
let app, auth, db;
try {
  setLogLevel('silent');
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) { console.error("Firebase init error:", e); }

// ─── Membership Tiers ─────────────────────────────────────────────────────────
const MEMBERSHIP_TIERS = {
  'ลูกค้าปกติ': {
    label: 'ลูกค้าปกติ',
    Icon: User,
    gradient: 'from-slate-100 to-slate-200',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-600',
    badgeBorder: 'border-slate-300',
    iconBg: 'bg-slate-200',
    iconColor: 'text-slate-500',
    headerGradient: 'from-slate-600 to-slate-500',
    ring: 'ring-slate-300',
    dot: 'bg-slate-400',
    order: 0,
  },
  'Premier card': {
    label: 'Premier Card',
    Icon: BadgeCheck,
    gradient: 'from-blue-100 to-sky-200',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-300',
    iconBg: 'bg-blue-500',
    iconColor: 'text-white',
    headerGradient: 'from-blue-600 to-sky-500',
    ring: 'ring-blue-300',
    dot: 'bg-blue-500',
    order: 1,
  },
  'Flora card': {
    label: 'Flora Card',
    Icon: Gem,
    gradient: 'from-emerald-100 to-teal-200',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-300',
    iconBg: 'bg-emerald-500',
    iconColor: 'text-white',
    headerGradient: 'from-emerald-600 to-teal-500',
    ring: 'ring-emerald-300',
    dot: 'bg-emerald-500',
    order: 2,
  },
  'Vip': {
    label: 'VIP',
    Icon: Award,
    gradient: 'from-violet-100 to-purple-200',
    badgeBg: 'bg-violet-100',
    badgeText: 'text-violet-700',
    badgeBorder: 'border-violet-300',
    iconBg: 'bg-violet-600',
    iconColor: 'text-white',
    headerGradient: 'from-violet-700 to-purple-500',
    ring: 'ring-violet-300',
    dot: 'bg-violet-500',
    order: 3,
  },
  'VVip': {
    label: 'VVIP',
    Icon: Crown,
    gradient: 'from-amber-100 to-yellow-200',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-700',
    badgeBorder: 'border-amber-400',
    iconBg: 'bg-gradient-to-br from-amber-400 to-yellow-500',
    iconColor: 'text-white',
    headerGradient: 'from-amber-500 to-yellow-400',
    ring: 'ring-amber-300',
    dot: 'bg-amber-500',
    order: 4,
  },
};

const TIER_KEYS = Object.keys(MEMBERSHIP_TIERS);
const DEFAULT_TIER = 'ลูกค้าปกติ';

// ─── Membership Badge Component ────────────────────────────────────────────────
const MemberBadge = ({ tier, size = 'sm' }) => {
  const cfg = MEMBERSHIP_TIERS[tier] || MEMBERSHIP_TIERS[DEFAULT_TIER];
  const IconC = cfg.Icon;
  const sizes = {
    xs: 'px-1.5 py-0.5 text-[9px] gap-0.5',
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-3 py-1 text-xs gap-1.5',
    lg: 'px-4 py-1.5 text-sm gap-2',
  };
  const iconSizes = { xs: 'w-2.5 h-2.5', sm: 'w-3 h-3', md: 'w-3.5 h-3.5', lg: 'w-4 h-4' };
  return (
    <span className={`inline-flex items-center font-bold rounded-full border ${cfg.badgeBg} ${cfg.badgeText} ${cfg.badgeBorder} ${sizes[size]}`}>
      <IconC className={`${iconSizes[size]} shrink-0`} />
      {cfg.label}
    </span>
  );
};

// ─── Membership Selector Modal ────────────────────────────────────────────────
const MembershipSelectorModal = ({ currentTier, patientName, onClose, onSave }) => {
  const [selected, setSelected] = useState(currentTier || DEFAULT_TIER);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(selected);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple-800 to-purple-600 px-5 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl"><Crown className="w-5 h-5" /></div>
            <div>
              <h3 className="font-bold text-base leading-tight">ประเภทสมาชิก</h3>
              <p className="text-purple-200 text-[10px]">{patientName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 space-y-2">
          {TIER_KEYS.map(key => {
            const cfg = MEMBERSHIP_TIERS[key];
            const IconC = cfg.Icon;
            const isSelected = selected === key;
            return (
              <button
                key={key}
                onClick={() => setSelected(key)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left
                  ${isSelected ? `border-transparent bg-gradient-to-r ${cfg.gradient} shadow-md` : 'border-slate-100 hover:border-slate-200 bg-white'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm
                  ${isSelected ? cfg.iconBg : 'bg-slate-100'}`}>
                  <IconC className={`w-5 h-5 ${isSelected ? cfg.iconColor : 'text-slate-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm ${isSelected ? 'text-slate-800' : 'text-slate-600'}`}>{cfg.label}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                  ${isSelected ? 'border-purple-600 bg-purple-600' : 'border-slate-300'}`}>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </button>
            );
          })}
        </div>
        <div className="px-4 pb-4 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-slate-600 font-bold bg-slate-100 hover:bg-slate-200 transition-colors text-sm">ยกเลิก</button>
          <button onClick={handleSave} disabled={saving}
            className={`flex-1 py-2.5 rounded-xl text-white font-bold transition-all text-sm flex items-center justify-center gap-2 shadow-md
              ${saving ? 'bg-purple-300 cursor-not-allowed' : 'bg-gradient-to-r from-purple-700 to-purple-500 hover:from-purple-800 active:scale-[0.98]'}`}>
            {saving ? <><Sparkles className="animate-spin w-4 h-4" /> กำลังบันทึก...</> : <><Save className="w-4 h-4" /> บันทึก</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const RECORDS_PATH = () => collection(db, 'artifacts', APP_ID, 'public', 'data', 'patient_records');
const BOOKINGS_PATH = () => collection(db, 'artifacts', APP_ID, 'public', 'data', 'bookings');

const todayStr = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
};

const EMPTY_RECORD = (t) => ({
  fullName: '', hn: '', phone: '', serviceDate: t,
  service: '', price: '', note: '',
  sale: '', assistant: '', appointedBy: '', doctor: ''
});

const EMPTY_BOOKING = (date = '') => ({
  bookingDate: date || todayStr(), bookingTime: '',
  hn: '', customerName: '', phoneNumber: '',
  procedure: '', bookerName: '',
  status: 'ยังไม่มา', callStatus: 'ยังไม่โทรคอนเฟิม'
});

const fmt = (d) => d ? new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
const fmtMoney = (n) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(n || 0);

const fmtDateTH = (d) => {
  if (!d) return '-';
  const [y, m, day] = d.split('-');
  const be = parseInt(y) + 543;
  return `${day}/${m}/${be}`;
};
const fmtTimeTH = (t) => t ? `${t} น.` : '-';
const getRecordImages = (r) => {
  const b = r.imagesBefore || []; const a = r.imagesAfter || [];
  return b.length || a.length ? [...b, ...a] : r.images || [];
};

const TIME_SLOTS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'];

const MONTH_TH = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const DAY_TH_SHORT = ['อา','จ','อ','พ','พฤ','ศ','ส'];

const STATUS_CONFIG = {
  'ยังไม่มา':     { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500',   border: 'border-blue-300' },
  'มาแล้ว':      { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-300' },
  'เลื่อนนัด':   { bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-500',  border: 'border-indigo-300' },
  'ไม่มาตามนัด': { bg: 'bg-rose-100',   text: 'text-rose-700',   dot: 'bg-rose-500',    border: 'border-rose-300' },
  'ยกเลิกนัด':   { bg: 'bg-red-200',    text: 'text-red-800',    dot: 'bg-red-700',     border: 'border-red-400' },
};

const CALL_CONFIG = {
  'ยังไม่โทรคอนเฟิม':   { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300', icon: PhoneMissed },
  'คอนเฟิมนัดแล้ว':    { bg: 'bg-emerald-50',text: 'text-emerald-700',border: 'border-emerald-400',icon: PhoneIncoming },
  'ไม่รับสายรอโทรใหม่': { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-400',  icon: PhoneOff },
};

// ─── ✅ DUPLICATE CHECK HELPER (shared across components) ────────────────────
// Returns array of duplicate bookings matching HN, name, OR phone on same date
const findDuplicateBookings = (allBookings, { hn, name, phone, date, excludeId }) => {
  if (!date) return [];
  const normStr = (s) => (s || '').trim().toLowerCase();
  const normPhone = (p) => (p || '').replace(/[-\s]/g, '').trim();

  return allBookings.filter(b => {
    if (b.id === excludeId) return false;
    if (b.bookingDate !== date) return false;
    if (b.status === 'ยกเลิกนัด' || b.status === 'เลื่อนนัด') return false;

    // HN match
    if (hn && hn.trim() && b.hn && b.hn.trim()) {
      if (normStr(b.hn) === normStr(hn)) return true;
    }
    // Name match (must be meaningful length)
    if (name && name.trim().length > 1 && b.customerName && b.customerName.trim().length > 1) {
      if (normStr(b.customerName) === normStr(name)) return true;
    }
    // Phone match (must be 9+ digits)
    const p1 = normPhone(phone);
    const p2 = normPhone(b.phoneNumber);
    if (p1.length >= 9 && p2.length >= 9 && p1 === p2) return true;

    return false;
  });
};

// Build a human-readable warning from duplicate list
const buildDupWarning = (dups, { hn, name, phone }) => {
  if (!dups.length) return '';
  const normStr = (s) => (s || '').trim().toLowerCase();
  const normPhone = (p) => (p || '').replace(/[-\s]/g, '').trim();

  const lines = dups.map(b => {
    const reasons = [];
    if (hn && hn.trim() && normStr(b.hn) === normStr(hn)) reasons.push(`HN: ${b.hn}`);
    if (name && name.trim().length > 1 && normStr(b.customerName) === normStr(name)) reasons.push(`ชื่อ: ${b.customerName}`);
    const p1 = normPhone(phone); const p2 = normPhone(b.phoneNumber);
    if (p1.length >= 9 && p1 === p2) reasons.push(`เบอร์: ${b.phoneNumber}`);
    return `• ${b.customerName} เวลา ${b.bookingTime || '?'} น. (ตรงกัน: ${reasons.join(', ')})`;
  });
  return `⚠ พบนัดซ้ำในวันที่เลือก:\n${lines.join('\n')}`;
};

// ─── Get patient tier from records ───────────────────────────────────────────
const getPatientTier = (records, hn) => {
  const recs = records.filter(r => r.hn === hn);
  if (!recs.length) return DEFAULT_TIER;
  for (const r of recs) {
    if (r.membershipTier && MEMBERSHIP_TIERS[r.membershipTier]) return r.membershipTier;
  }
  return DEFAULT_TIER;
};

const isNewCustomer = (booking, patients) => {
  if (!booking.hn || booking.hn.trim() === '') return true;
  return !patients.some(p => String(p.hn).toLowerCase() === String(booking.hn).toLowerCase());
};

// ─── Sub-components ──────────────────────────────────────────────────────────
const ImageUploadBlock = ({ type, existingImages, setExistingImages, newPreviews, onRemoveNew, onClickAdd, onLightbox }) => {
  const total = existingImages.length + newPreviews.length;
  const isBefore = type === 'before';
  const cfg = isBefore
    ? { label: '🔴 ก่อนทำ', border: 'border-red-200', bg: 'bg-red-50/40', badge: 'bg-red-100 text-red-600', add: 'border-red-200 hover:bg-red-50' }
    : { label: '🟢 หลังทำ', border: 'border-green-200', bg: 'bg-green-50/40', badge: 'bg-green-100 text-green-600', add: 'border-green-200 hover:bg-green-50' };
  return (
    <div className={`rounded-xl border-2 ${cfg.border} ${cfg.bg} p-3`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-slate-700">{cfg.label}</span>
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>{total}/5</span>
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
          <div onClick={onClickAdd} className={`aspect-square rounded-lg border-2 border-dashed ${cfg.add} flex flex-col items-center justify-center cursor-pointer transition-colors`}>
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
        {[
          { name: 'sale', label: 'Sale', Icon: ShoppingBag, req: true, ph: 'ชื่อ Sale' },
          { name: 'appointedBy', label: 'ผู้นัด', Icon: UserCheck, req: false, ph: 'ชื่อผู้นัด' },
          { name: 'assistant', label: 'ผู้ช่วย', Icon: Users, req: true, ph: 'ชื่อผู้ช่วย' },
          { name: 'doctor', label: 'แพทย์', Icon: Stethoscope, req: true, ph: 'ชื่อแพทย์' },
        ].map(({ name, label: lbl, Icon, req, ph }) => (
          <div key={name}>
            <label className={`block text-sm font-semibold ${label} mb-1`}>{lbl} {req && <span className="text-red-500">*</span>}</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Icon className={`h-4 w-4 ${icon}`} /></div>
              <input type="text" name={name} value={formData[name]} onChange={handleInputChange} required={req} placeholder={ph}
                className={`pl-10 w-full rounded-lg border ${ring} px-3 py-2 text-sm text-slate-700 bg-gray-50/50`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, Icon, bg, text, onClick }) => (
  <div onClick={onClick} className={`cursor-pointer hover:-translate-y-1 bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-all`}>
    <div className={`p-2 sm:p-3 ${bg} ${text} rounded-xl sm:rounded-2xl mb-2`}><Icon className="w-4 h-4 sm:w-5 sm:h-5" /></div>
    <p className="text-[8px] sm:text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1 leading-tight">{label}</p>
    <h3 className="text-xl sm:text-2xl font-bold text-gray-800">{value}</h3>
  </div>
);

// ─── Register New Patient Mini-Modal ─────────────────────────────────────────
const RegisterPatientModal = ({ onClose, onRegistered }) => {
  const [regForm, setRegForm] = useState({ fullName: '', hn: '', phone: '', membershipTier: DEFAULT_TIER });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async () => {
    if (!regForm.fullName.trim()) { setErr('กรุณากรอกชื่อ-นามสกุล'); return; }
    if (!regForm.hn.trim()) { setErr('กรุณากรอกเลข HN'); return; }
    setSaving(true);
    try {
      await addDoc(RECORDS_PATH(), {
        fullName: regForm.fullName.trim(),
        hn: regForm.hn.trim(),
        phone: regForm.phone.trim(),
        membershipTier: regForm.membershipTier,
        serviceDate: todayStr(),
        service: 'ลงทะเบียนผู้ป่วยใหม่',
        price: null,
        note: 'ลงทะเบียนผ่านระบบนัดหมาย',
        sale: '', assistant: '', appointedBy: '', doctor: '',
        imagesBefore: [], imagesAfter: [], images: [],
        createdAt: serverTimestamp(),
      });
      onRegistered({ hn: regForm.hn.trim(), fullName: regForm.fullName.trim(), phone: regForm.phone.trim(), membershipTier: regForm.membershipTier });
    } catch (e) { setErr('เกิดข้อผิดพลาด: ' + e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl"><UserPlus className="w-5 h-5" /></div>
            <div>
              <h3 className="font-bold text-base leading-tight">ลงทะเบียนลูกค้าใหม่</h3>
              <p className="text-emerald-100 text-[10px]">บันทึกข้อมูลเข้าระบบประวัติลูกค้า</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">ชื่อ-นามสกุล <span className="text-red-500">*</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-4 w-4 text-emerald-400" /></div>
              <input autoFocus type="text" value={regForm.fullName}
                onChange={e => { setRegForm(f => ({ ...f, fullName: e.target.value })); setErr(''); }}
                placeholder="เช่น สมหญิง สวยงาม"
                className="pl-10 w-full rounded-xl border border-emerald-200 focus:border-emerald-500 focus:ring focus:ring-emerald-200 px-3 py-2.5 text-sm text-slate-700" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">เลข HN <span className="text-red-500">*</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Hash className="h-4 w-4 text-emerald-400" /></div>
              <input type="text" value={regForm.hn}
                onChange={e => { setRegForm(f => ({ ...f, hn: e.target.value })); setErr(''); }}
                placeholder="เช่น HN12345"
                className="pl-10 w-full rounded-xl border border-emerald-200 focus:border-emerald-500 focus:ring focus:ring-emerald-200 px-3 py-2.5 text-sm text-slate-700" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">เบอร์โทรศัพท์</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Phone className="h-4 w-4 text-emerald-400" /></div>
              <input type="tel" value={regForm.phone}
                onChange={e => setRegForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="08X-XXX-XXXX"
                className="pl-10 w-full rounded-xl border border-emerald-200 focus:border-emerald-500 focus:ring focus:ring-emerald-200 px-3 py-2.5 text-sm text-slate-700" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1"><Crown className="w-3.5 h-3.5 text-amber-500" /> ประเภทสมาชิก</label>
            <div className="grid grid-cols-1 gap-1.5">
              {TIER_KEYS.map(key => {
                const cfg = MEMBERSHIP_TIERS[key];
                const IconC = cfg.Icon;
                const isSelected = regForm.membershipTier === key;
                return (
                  <button key={key} type="button" onClick={() => setRegForm(f => ({ ...f, membershipTier: key }))}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-left transition-all text-sm font-bold
                      ${isSelected ? `bg-gradient-to-r ${cfg.gradient} ${cfg.badgeBorder} text-slate-800` : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}>
                    <IconC className={`w-4 h-4 shrink-0 ${isSelected ? cfg.badgeText : 'text-slate-300'}`} />
                    {cfg.label}
                    {isSelected && <span className="ml-auto text-[10px] font-bold text-emerald-600">✓ เลือกแล้ว</span>}
                  </button>
                );
              })}
            </div>
          </div>
          {err && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 font-medium">{err}</p>}
        </div>
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-slate-600 font-bold bg-slate-100 hover:bg-slate-200 transition-colors text-sm">ยกเลิก</button>
          <button onClick={handleSubmit} disabled={saving || !regForm.fullName.trim() || !regForm.hn.trim()}
            className={`flex-1 py-2.5 rounded-xl text-white font-bold transition-all text-sm flex items-center justify-center gap-2 shadow-md
              ${saving || !regForm.fullName.trim() || !regForm.hn.trim() ? 'bg-emerald-300 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 active:scale-[0.98]'}`}>
            {saving ? <><Sparkles className="animate-spin w-4 h-4" /> กำลังบันทึก...</> : <><UserPlus className="w-4 h-4" /> ลงทะเบียน</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── ✅ DUPLICATE WARNING DISPLAY COMPONENT ──────────────────────────────────
const DupWarnBox = ({ warn }) => {
  if (!warn) return null;
  const lines = warn.split('\n');
  const header = lines[0];
  const details = lines.slice(1);
  return (
    <div className="flex items-start gap-2.5 bg-amber-50 border-2 border-amber-300 rounded-2xl px-3.5 py-3">
      <div className="shrink-0 mt-0.5 w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center">
        <AlertTriangle className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-amber-800 font-bold text-xs leading-tight">{header}</p>
        {details.map((line, i) => (
          <p key={i} className="text-amber-700 text-[11px] font-medium mt-0.5 leading-snug">{line}</p>
        ))}
        <p className="text-amber-600 text-[10px] mt-1.5 font-semibold">กรุณาตรวจสอบก่อนยืนยันการจอง</p>
      </div>
    </div>
  );
};

// ─── Booking Form Modal ───────────────────────────────────────────────────────
const BookingFormModal = ({ booking, patients, onClose, onSave, isOffline, allBookings }) => {
  const [form, setForm] = useState(booking);
  // ✅ renamed from hnWarn → dupWarn
  const [dupWarn, setDupWarn] = useState('');
  const [saving, setSaving] = useState(false);
  const [custMode, setCustMode] = useState(booking.hn ? 'existing' : 'new');

  const [hnSearch, setHnSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(
    booking.hn ? patients.find(p => p.hn === booking.hn) || null : null
  );
  const [showRegister, setShowRegister] = useState(false);
  const searchRef = useRef(null);

  const filteredPatients = hnSearch.trim().length > 0
    ? patients.filter(p =>
        (p.hn || '').toLowerCase().includes(hnSearch.toLowerCase()) ||
        (p.fullName || '').toLowerCase().includes(hnSearch.toLowerCase()) ||
        (p.phone || '').includes(hnSearch)
      ).slice(0, 8)
    : patients.slice(0, 8);

  // ✅ NEW: checkDuplicate — checks HN, name, AND phone
  const checkDuplicate = useCallback((hn, name, phone, date, excludeId) => {
    const dups = findDuplicateBookings(allBookings, { hn, name, phone, date, excludeId });
    setDupWarn(buildDupWarning(dups, { hn, name, phone }));
  }, [allBookings]);

  const selectPatient = (p) => {
    setSelectedPatient(p);
    setForm(f => ({ ...f, hn: p.hn, customerName: p.fullName, phoneNumber: p.phone || '' }));
    setHnSearch('');
    setShowDropdown(false);
    checkDuplicate(p.hn, p.fullName, p.phone, form.bookingDate, booking.id);
  };

  const clearPatient = () => {
    setSelectedPatient(null);
    setForm(f => ({ ...f, hn: '', customerName: '', phoneNumber: '' }));
    setHnSearch('');
    setDupWarn('');
  };

  const switchMode = (mode) => {
    setCustMode(mode);
    clearPatient();
    setForm(f => ({ ...f, hn: '', customerName: '', phoneNumber: '' }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...form, [name]: value };
    setForm(updated);
    // Re-check on date, name, or phone change
    if (name === 'bookingDate' || name === 'customerName' || name === 'phoneNumber') {
      checkDuplicate(
        updated.hn,
        updated.customerName,
        updated.phoneNumber,
        updated.bookingDate,
        booking.id
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // ✅ Block if any duplicate found (warn starts with ⚠)
    if (dupWarn.startsWith('⚠')) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const handleRegistered = (newPatient) => {
    setShowRegister(false);
    setSelectedPatient(newPatient);
    setForm(f => ({ ...f, hn: newPatient.hn, customerName: newPatient.fullName, phoneNumber: newPatient.phone || '' }));
    setCustMode('existing');
    checkDuplicate(newPatient.hn, newPatient.fullName, newPatient.phone, form.bookingDate, booking.id);
  };

  useEffect(() => {
    const handler = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowDropdown(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <>
      {showRegister && <RegisterPatientModal onClose={() => setShowRegister(false)} onRegistered={handleRegistered} />}
      <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh]">
          <div className="bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-4 flex items-center justify-between text-white shrink-0 rounded-t-3xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl"><CalendarPlus className="w-5 h-5" /></div>
              <h2 className="text-lg font-bold">{booking.id ? 'แก้ไขนัดหมาย' : 'เพิ่มนัดหมายใหม่'}</h2>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-full transition-colors"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSubmit} className="overflow-y-auto flex-grow p-5 space-y-4">
            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 space-y-3">
              <p className="text-xs font-bold text-blue-500 uppercase tracking-wider">ข้อมูลลูกค้า</p>
              <div className="flex gap-1.5 bg-white/70 p-1 rounded-xl border border-blue-100">
                <button type="button" onClick={() => switchMode('existing')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5
                    ${custMode === 'existing' ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-500 hover:text-blue-700'}`}>
                  <Star className="w-3 h-3" /> ลูกค้าเดิม (มี HN)
                </button>
                <button type="button" onClick={() => switchMode('new')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5
                    ${custMode === 'new' ? 'bg-amber-500 text-white shadow-sm' : 'text-amber-600 hover:text-amber-700'}`}>
                  <UserPlus className="w-3 h-3" /> ลูกค้าใหม่
                </button>
              </div>

              {custMode === 'existing' && (
                <div className="space-y-2">
                  {selectedPatient ? (
                    <div className="flex items-center gap-3 bg-white border-2 border-blue-400 rounded-xl px-3 py-2.5">
                      <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-bold text-slate-800 text-sm truncate">{selectedPatient.fullName}</p>
                          {selectedPatient.membershipTier && <MemberBadge tier={selectedPatient.membershipTier} size="xs" />}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="flex items-center text-[11px] text-blue-600 font-bold"><Hash className="w-2.5 h-2.5 mr-0.5" />{selectedPatient.hn}</span>
                          {selectedPatient.phone && <span className="flex items-center text-[11px] text-slate-400"><Phone className="w-2.5 h-2.5 mr-0.5" />{selectedPatient.phone}</span>}
                        </div>
                      </div>
                      <button type="button" onClick={clearPatient} className="shrink-0 p-1.5 bg-slate-100 hover:bg-red-100 rounded-full transition-colors">
                        <X className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" />
                      </button>
                    </div>
                  ) : (
                    <div ref={searchRef} className="relative">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-blue-400" /></div>
                        <input type="text" value={hnSearch}
                          onChange={e => { setHnSearch(e.target.value); setShowDropdown(true); }}
                          onFocus={() => setShowDropdown(true)}
                          placeholder="ค้นหาชื่อ, HN หรือเบอร์โทร..."
                          className="pl-10 w-full rounded-xl border border-blue-200 focus:border-blue-500 focus:ring focus:ring-blue-200 px-3 py-2.5 text-sm bg-white" />
                        {hnSearch && (
                          <button type="button" onClick={() => { setHnSearch(''); setShowDropdown(false); }}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            <X className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                        )}
                      </div>
                      {showDropdown && (
                        <div className="absolute z-10 left-0 right-0 mt-1 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden max-h-48 overflow-y-auto">
                          {filteredPatients.length === 0 ? (
                            <div className="px-4 py-3 text-xs text-slate-400 text-center">ไม่พบลูกค้า</div>
                          ) : filteredPatients.map(p => (
                            <div key={p.hn} onClick={() => selectPatient(p)}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 cursor-pointer transition-colors border-b border-slate-50 last:border-0">
                              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
                                <User className="w-3.5 h-3.5 text-purple-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="font-bold text-slate-800 text-sm truncate">{p.fullName}</p>
                                  {p.membershipTier && p.membershipTier !== DEFAULT_TIER && <MemberBadge tier={p.membershipTier} size="xs" />}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] text-blue-500 font-bold flex items-center"><Hash className="w-2.5 h-2.5 mr-0.5" />{p.hn}</span>
                                  {p.phone && <span className="text-[11px] text-slate-400 flex items-center"><Phone className="w-2.5 h-2.5 mr-0.5" />{p.phone}</span>}
                                </div>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {selectedPatient && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
                        <input name="phoneNumber" value={form.phoneNumber} onChange={handleChange} required placeholder="08x-xxx-xxxx"
                          className="w-full rounded-xl border border-blue-200 focus:border-blue-500 focus:ring focus:ring-blue-200 px-3 py-2 text-sm bg-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">ชื่อ (แก้ไขได้)</label>
                        <input name="customerName" value={form.customerName} onChange={handleChange}
                          className="w-full rounded-xl border border-blue-200 focus:border-blue-500 focus:ring focus:ring-blue-200 px-3 py-2 text-sm bg-white" />
                      </div>
                    </div>
                  )}

                  <div className="border-t border-blue-100 pt-2">
                    <p className="text-[10px] text-slate-400 font-medium mb-1.5">มาครั้งแรก ยังไม่มีข้อมูลในระบบ?</p>
                    <button type="button" onClick={() => setShowRegister(true)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-500 hover:text-white border-2 border-emerald-300 hover:border-emerald-500 rounded-xl transition-all">
                      <UserPlus className="w-4 h-4" /> ลงทะเบียนลูกค้าใหม่
                    </button>
                  </div>
                </div>
              )}

              {custMode === 'new' && (
                <div className="space-y-2.5">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-center gap-2">
                    <UserPlus className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <p className="text-[11px] text-amber-700 font-medium">กรอกข้อมูลเบื้องต้นสำหรับนัดหมาย (ไม่สร้างประวัติในระบบ)</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">ชื่อ-นามสกุล <span className="text-red-500">*</span></label>
                    <input name="customerName" value={form.customerName} onChange={handleChange} required placeholder="ชื่อผู้รับบริการ"
                      className="w-full rounded-xl border border-amber-200 focus:border-amber-400 focus:ring focus:ring-amber-100 px-3 py-2.5 text-sm bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
                    <input name="phoneNumber" value={form.phoneNumber} onChange={handleChange} required placeholder="08x-xxx-xxxx"
                      className="w-full rounded-xl border border-amber-200 focus:border-amber-400 focus:ring focus:ring-amber-100 px-3 py-2.5 text-sm bg-white" />
                  </div>
                </div>
              )}

              {/* ✅ NEW: Duplicate warning display */}
              {dupWarn && <DupWarnBox warn={dupWarn} />}
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-1">รายละเอียดนัดหมาย</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">วันที่ <span className="text-red-500">*</span></label>
                  <input type="date" name="bookingDate" value={form.bookingDate} onChange={handleChange} required
                    className="w-full rounded-xl border border-slate-200 focus:border-blue-500 focus:ring focus:ring-blue-200 px-3 py-2 text-sm bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">เวลา <span className="text-red-500">*</span></label>
                  <select name="bookingTime" value={form.bookingTime} onChange={handleChange} required
                    className="w-full rounded-xl border border-slate-200 focus:border-blue-500 focus:ring focus:ring-blue-200 px-3 py-2 text-sm bg-white">
                    <option value="">เลือกเวลา</option>
                    {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">หัตถการ <span className="text-red-500">*</span></label>
                <input name="procedure" value={form.procedure} onChange={handleChange} required placeholder="ระบุบริการที่ต้องการรับ"
                  className="w-full rounded-xl border border-slate-200 focus:border-blue-500 focus:ring focus:ring-blue-200 px-3 py-2 text-sm bg-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">ชื่อผู้นัด</label>
                <input name="bookerName" value={form.bookerName} onChange={handleChange} placeholder="ชื่อผู้ดำเนินการจอง"
                  className="w-full rounded-xl border border-slate-200 focus:border-blue-500 focus:ring focus:ring-blue-200 px-3 py-2 text-sm bg-white" />
              </div>
            </div>
          </form>
          <div className="border-t border-slate-100 p-4 bg-gray-50 flex justify-end gap-3 shrink-0 rounded-b-3xl">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-200 transition-colors">ยกเลิก</button>
            {/* ✅ Button disabled when duplicate found */}
            <button onClick={handleSubmit} disabled={saving || dupWarn.startsWith('⚠')}
              className={`px-6 py-2.5 rounded-xl text-white font-bold shadow-md transition-all flex items-center gap-2 ${
                saving ? 'bg-blue-300 cursor-not-allowed' :
                dupWarn.startsWith('⚠') ? 'bg-amber-300 cursor-not-allowed' :
                'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:shadow-lg active:scale-[0.98]'
              }`}>
              {saving ? <><Sparkles className="animate-spin w-4 h-4" /> กำลังบันทึก...</> :
               dupWarn.startsWith('⚠') ? <><AlertTriangle className="w-4 h-4" /> พบนัดซ้ำ</> :
               <><Save className="w-4 h-4" /> ยืนยันการจอง</>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// ─── Booking Detail Modal ─────────────────────────────────────────────────────
const BookingDetailModal = ({ booking, onClose, onUpdateStatus, onUpdateCallStatus, onEdit, patients, allBookings, records }) => {
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelNote, setCancelNote] = useState('');
  const [showReschedule, setShowReschedule] = useState(false);
  const [reschedDate, setReschedDate] = useState(booking.bookingDate);
  const [reschedTime, setReschedTime] = useState(booking.bookingTime);
  const [showNextBooking, setShowNextBooking] = useState(false);
  const [nextDate, setNextDate] = useState('');
  const [nextTime, setNextTime] = useState(booking.bookingTime);
  const [nextProc, setNextProc] = useState(booking.procedure);
  const [updating, setUpdating] = useState(false);
  const [localCallStatus, setLocalCallStatus] = useState(booking.callStatus || 'ยังไม่โทรคอนเฟิม');
  // ── Delete with password ──
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const doDelete = async () => {
    if (deletePassword !== 'P@ssw0rd88') {
      setDeleteError('รหัสผ่านไม่ถูกต้อง กรุณาติดต่อผู้ดูแลระบบ');
      setDeletePassword('');
      return;
    }
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'bookings', booking.id));
      onClose();
    } catch (e) {
      setDeleteError('เกิดข้อผิดพลาด: ' + e.message);
    } finally {
      setDeleting(false);
    }
  };

  const sc = STATUS_CONFIG[booking.status] || STATUS_CONFIG['ยังไม่มา'];
  const newCust = isNewCustomer(booking, patients);
  const patientTier = booking.hn ? getPatientTier(records, booking.hn) : DEFAULT_TIER;
  const tierCfg = MEMBERSHIP_TIERS[patientTier] || MEMBERSHIP_TIERS[DEFAULT_TIER];

  const doStatus = async (status) => { setUpdating(true); await onUpdateStatus(booking.id, { status }); setUpdating(false); onClose(); };

  const doCancel = async () => {
    const note = cancelReason ? (cancelNote ? `${cancelReason} - ${cancelNote}` : cancelReason) : cancelNote;
    if (!note) return;
    setUpdating(true);
    await onUpdateStatus(booking.id, { status: 'ยกเลิกนัด', cancelNote: note });
    setUpdating(false);
    onClose();
  };

  const doReschedule = async () => {
    if (!reschedDate || !reschedTime) return;
    setUpdating(true);
    await onUpdateStatus(booking.id, { status: 'เลื่อนนัด' });
    const cleanProc = (booking.procedure || '').replace(/\s*\(ย้ายจาก.*?\)/g, '').trim();
    const dispDate = fmtDateTH(booking.bookingDate);
    await addDoc(BOOKINGS_PATH(), {
      bookingDate: reschedDate, bookingTime: reschedTime,
      hn: booking.hn || '', customerName: booking.customerName,
      phoneNumber: booking.phoneNumber || '', procedure: cleanProc ? `${cleanProc} (ย้ายจาก ${dispDate} เวลา ${booking.bookingTime})` : `(ย้ายจาก ${dispDate})`,
      bookerName: booking.bookerName || '', status: 'ยังไม่มา', callStatus: 'ยังไม่โทรคอนเฟิม',
      createdAt: serverTimestamp()
    });
    setUpdating(false);
    onClose();
  };

  // ✅ UPDATED doNextBooking: checks HN, name, AND phone
  const doNextBooking = async () => {
    if (!nextDate || !nextTime || !nextProc) return;

    const dups = findDuplicateBookings(allBookings, {
      hn: booking.hn,
      name: booking.customerName,
      phone: booking.phoneNumber,
      date: nextDate,
      excludeId: booking.id,
    });

    if (dups.length) {
      const warn = buildDupWarning(dups, {
        hn: booking.hn,
        name: booking.customerName,
        phone: booking.phoneNumber,
      });
      alert(`❌ ไม่สามารถจองได้\n\n${warn}`);
      return;
    }

    setUpdating(true);
    await addDoc(BOOKINGS_PATH(), {
      bookingDate: nextDate, bookingTime: nextTime,
      hn: booking.hn || '', customerName: booking.customerName,
      phoneNumber: booking.phoneNumber || '', procedure: nextProc,
      bookerName: booking.bookerName || '', status: 'ยังไม่มา', callStatus: 'ยังไม่โทรคอนเฟิม',
      createdAt: serverTimestamp()
    });
    setUpdating(false);
    onClose();
    alert(`✅ จองครั้งถัดไปสำเร็จ!\n${booking.customerName} วันที่ ${fmtDateTH(nextDate)} เวลา ${fmtTimeTH(nextTime)}`);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh]">
        <div className="px-6 py-4 flex items-start justify-between shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${sc.bg} ${sc.text}`}>{booking.status}</span>
            {newCust ? (
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-300">
                <UserPlus className="w-3 h-3" /> ลูกค้าใหม่
              </span>
            ) : (
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-300">
                <Star className="w-3 h-3" /> ลูกค้าเก่า
              </span>
            )}
            {booking.hn && <MemberBadge tier={patientTier} size="sm" />}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto flex-grow px-6 pb-4 space-y-4">
          <div>
            <h4 className="text-2xl font-bold text-slate-900 mb-0.5">{booking.customerName || 'ไม่มีชื่อ'}</h4>
            <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
              <Hash className="w-3.5 h-3.5" /><span>HN: {booking.hn || 'ลูกค้าใหม่'}</span>
            </div>
          </div>
          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5" /> สถานะการโทรยืนยัน
            </p>
            <div className="flex flex-col gap-1.5">
              {Object.entries(CALL_CONFIG).map(([opt, cc]) => {
                const isSelected = localCallStatus === opt;
                const IconC = cc.icon;
                return (
                  <label key={opt}
                    onClick={() => {
                      setLocalCallStatus(opt);
                      onUpdateCallStatus(booking.id, opt);
                    }}
                    className={`flex items-center gap-2.5 cursor-pointer p-2 rounded-xl border transition-all hover:border-blue-300 ${isSelected ? `${cc.border} ${cc.bg}` : 'border-slate-200 bg-white'}`}>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-300 bg-white'}`}>
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <IconC className={`w-3.5 h-3.5 ${isSelected ? cc.text : 'text-slate-400'}`} />
                    <span className={`text-xs font-semibold ${isSelected ? cc.text : 'text-slate-500'}`}>{opt}</span>
                  </label>
                );
              })}
            </div>
          </div>
          {[
            { Icon: Phone, label: 'เบอร์โทรศัพท์', val: booking.phoneNumber || '-' },
            { Icon: Calendar, label: 'วันเวลาที่นัด', val: `${fmtDateTH(booking.bookingDate)}  ${fmtTimeTH(booking.bookingTime)}` },
            { Icon: Activity, label: 'หัตถการ', val: booking.procedure || '-' },
            { Icon: UserCheck, label: 'ชื่อผู้นัด', val: booking.bookerName || '-' },
          ].map(({ Icon, label, val }) => (
            <div key={label} className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl">
              <div className="w-9 h-9 bg-white shadow-sm rounded-xl flex items-center justify-center text-slate-500 shrink-0"><Icon className="w-4 h-4" /></div>
              <div><p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{label}</p><p className="font-bold text-slate-700 text-sm">{val}</p></div>
            </div>
          ))}
          {booking.cancelNote && (
            <div className="flex items-start gap-3 bg-red-50 p-3 rounded-2xl border border-red-100">
              <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-red-400 shrink-0"><AlertTriangle className="w-4 h-4" /></div>
              <div><p className="text-[10px] uppercase font-bold text-red-400 tracking-wider">สาเหตุยกเลิก</p><p className="font-bold text-red-700 text-sm">{booking.cancelNote}</p></div>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'มาแล้ว', bg: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700', status: 'มาแล้ว' },
              { label: 'ยังไม่มา', bg: 'bg-blue-100 hover:bg-blue-200 text-blue-700', status: 'ยังไม่มา' },
              { label: 'ไม่มา', bg: 'bg-rose-100 hover:bg-rose-200 text-rose-600', status: 'ไม่มาตามนัด' },
            ].map(({ label, bg, status }) => (
              <button key={label} onClick={() => doStatus(status)} disabled={updating}
                className={`flex-1 min-w-[70px] ${bg} py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50`}>{label}</button>
            ))}
            <button onClick={() => { setShowReschedule(v => !v); setShowCancelForm(false); setShowNextBooking(false); }} disabled={updating}
              className="flex-1 min-w-[70px] bg-indigo-100 hover:bg-indigo-200 text-indigo-700 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95">เลื่อนนัด</button>
            <button onClick={() => { setShowCancelForm(v => !v); setShowReschedule(false); setShowNextBooking(false); }} disabled={updating}
              className="flex-1 min-w-[70px] bg-red-800 hover:bg-red-900 text-white py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95">ยกเลิก</button>
          </div>
          {showReschedule && (
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-3">
              <h5 className="text-sm font-bold text-indigo-800 flex items-center gap-2"><CalendarDays className="w-4 h-4" /> ระบุวันและเวลาใหม่</h5>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={reschedDate} onChange={e => setReschedDate(e.target.value)} min={todayStr()}
                  className="p-2 rounded-xl border border-indigo-200 text-sm outline-none focus:ring-2 focus:ring-indigo-400 bg-white" />
                <select value={reschedTime} onChange={e => setReschedTime(e.target.value)}
                  className="p-2 rounded-xl border border-indigo-200 text-sm outline-none focus:ring-2 focus:ring-indigo-400 bg-white">
                  <option value="">เวลา</option>
                  {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowReschedule(false)} className="px-3 py-2 bg-white text-indigo-600 border border-indigo-200 font-bold rounded-xl text-sm">ยกเลิก</button>
                <button onClick={doReschedule} disabled={updating || !reschedDate || !reschedTime}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-sm transition-all disabled:opacity-50">ยืนยันย้ายคิว</button>
              </div>
            </div>
          )}
          {showCancelForm && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl space-y-3">
              <h5 className="text-sm font-bold text-red-800 flex items-center gap-2"><XCircle className="w-4 h-4" /> สาเหตุการยกเลิก</h5>
              <div className="grid grid-cols-3 gap-1.5">
                {['ติดธุระ', 'ไม่สะดวก', 'อาการดีขึ้น', 'เปลี่ยนใจ', 'ติดต่อไม่ได้', 'อื่นๆ'].map(r => (
                  <button key={r} type="button" onClick={() => setCancelReason(r)}
                    className={`px-2 py-1.5 rounded-lg border text-[11px] font-medium transition-all ${cancelReason === r ? 'bg-red-700 text-white border-red-700' : 'bg-white text-red-700 border-red-200 hover:bg-red-100'}`}>{r}</button>
                ))}
              </div>
              <input type="text" value={cancelNote} onChange={e => setCancelNote(e.target.value)} placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
                className="w-full p-2 rounded-xl border border-red-200 text-sm outline-none focus:ring-2 focus:ring-red-400 bg-white" />
              <div className="flex gap-2">
                <button onClick={() => setShowCancelForm(false)} className="px-3 py-2 bg-white text-slate-600 border border-slate-200 font-bold rounded-xl text-sm">ยกเลิก</button>
                <button onClick={doCancel} disabled={updating || (!cancelReason && !cancelNote)}
                  className="flex-1 bg-red-700 hover:bg-red-800 text-white font-bold py-2 rounded-xl text-sm disabled:opacity-50">ยืนยันยกเลิกนัด</button>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={() => { setShowNextBooking(v => !v); setShowReschedule(false); setShowCancelForm(false); }}
              className="flex-1 flex items-center justify-center gap-2 py-2 text-sm text-teal-600 hover:text-white bg-teal-50 hover:bg-teal-500 border border-teal-200 hover:border-teal-500 rounded-xl transition-all font-bold">
              <CalendarPlus className="w-3.5 h-3.5" /> จองครั้งถัดไป
            </button>
            <button onClick={() => { onEdit(booking); onClose(); }}
              className="flex-1 flex items-center justify-center gap-2 py-2 text-sm text-slate-500 hover:text-blue-500 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl transition-all font-medium">
              <FileEdit className="w-3.5 h-3.5" /> แก้ไขข้อมูล
            </button>
            <button onClick={() => { setShowDeleteModal(true); setDeletePassword(''); setDeleteError(''); }}
              className="p-2 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 border border-slate-200 hover:border-red-300 rounded-xl transition-all"
              title="ลบรายการนัด">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* ── Delete Password Modal ── */}
          {showDeleteModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-red-700 to-red-500 px-5 py-4 flex items-center justify-between text-white">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-white/20 rounded-xl"><Trash2 className="w-5 h-5" /></div>
                    <div>
                      <h3 className="font-bold text-base leading-tight">ลบรายการนัดหมาย</h3>
                      <p className="text-red-200 text-[10px]">เฉพาะผู้ดูแลระบบเท่านั้น</p>
                    </div>
                  </div>
                  <button onClick={() => setShowDeleteModal(false)} className="p-1.5 hover:bg-white/20 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-5 space-y-4">
                  {/* Warning box */}
                  <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-3.5">
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-red-800">ต้องการลบรายการนี้?</p>
                      <p className="text-xs text-red-600 mt-0.5 font-medium">{booking.customerName} · {fmtDateTH(booking.bookingDate)} {fmtTimeTH(booking.bookingTime)}</p>
                      <p className="text-[11px] text-red-500 mt-1.5 leading-snug">
                        การลบข้อมูลไม่สามารถกู้คืนได้<br/>
                        <span className="font-bold">กรุณาติดต่อผู้ดูแลระบบเพื่อขอรหัสผ่านในการลบข้อมูล</span>
                      </p>
                    </div>
                  </div>
                  {/* Password input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-red-400" /> รหัสผ่านผู้ดูแลระบบ
                    </label>
                    <input
                      type="password"
                      value={deletePassword}
                      onChange={e => { setDeletePassword(e.target.value); setDeleteError(''); }}
                      onKeyDown={e => e.key === 'Enter' && doDelete()}
                      placeholder="กรอกรหัสผ่าน"
                      autoFocus
                      className={`w-full rounded-xl border px-4 py-2.5 text-sm text-slate-700 outline-none transition-all
                        ${deleteError ? 'border-red-400 focus:ring-2 focus:ring-red-200 bg-red-50' : 'border-slate-200 focus:border-red-400 focus:ring-2 focus:ring-red-100'}`}
                    />
                    {deleteError && (
                      <p className="mt-1.5 text-xs text-red-600 font-semibold flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5 shrink-0" /> {deleteError}
                      </p>
                    )}
                  </div>
                </div>
                <div className="px-5 pb-5 flex gap-3">
                  <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2.5 rounded-xl text-slate-600 font-bold bg-slate-100 hover:bg-slate-200 transition-colors text-sm">ยกเลิก</button>
                  <button onClick={doDelete} disabled={deleting || !deletePassword}
                    className={`flex-1 py-2.5 rounded-xl text-white font-bold transition-all text-sm flex items-center justify-center gap-2 shadow-md
                      ${deleting || !deletePassword ? 'bg-red-300 cursor-not-allowed' : 'bg-gradient-to-r from-red-700 to-red-500 hover:from-red-800 active:scale-[0.98]'}`}>
                    {deleting ? <><Sparkles className="animate-spin w-4 h-4" /> กำลังลบ...</> : <><Trash2 className="w-4 h-4" /> ยืนยันลบ</>}
                  </button>
                </div>
              </div>
            </div>
          )}
          {showNextBooking && (
            <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl space-y-3">
              <h5 className="text-sm font-bold text-teal-800 flex items-center gap-2"><CalendarPlus className="w-4 h-4" /> จองครั้งถัดไป</h5>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={nextDate} onChange={e => setNextDate(e.target.value)} min={todayStr()}
                  className="p-2 rounded-xl border border-teal-200 text-sm outline-none focus:ring-2 focus:ring-teal-400 bg-white" />
                <select value={nextTime} onChange={e => setNextTime(e.target.value)}
                  className="p-2 rounded-xl border border-teal-200 text-sm outline-none focus:ring-2 focus:ring-teal-400 bg-white">
                  <option value="">เวลา</option>
                  {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <input value={nextProc} onChange={e => setNextProc(e.target.value)} placeholder="หัตถการ"
                className="w-full p-2 rounded-xl border border-teal-200 text-sm outline-none focus:ring-2 focus:ring-teal-400 bg-white" />
              <div className="flex gap-2">
                <button onClick={() => setShowNextBooking(false)} className="px-3 py-2 bg-white text-teal-600 border border-teal-200 font-bold rounded-xl text-sm">ยกเลิก</button>
                <button onClick={doNextBooking} disabled={updating || !nextDate || !nextTime || !nextProc}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 rounded-xl text-sm disabled:opacity-50">ยืนยันการจอง</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Booking List Modal ───────────────────────────────────────────────────────
const BookingListModal = ({ title, bookings, onClose, onSelectBooking, patients, records }) => (
  <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
    <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[85vh]">
      <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 shrink-0">
        <h3 className="font-bold text-slate-800 text-base">{title} ({bookings.length})</h3>
        <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
      </div>
      <div className="overflow-y-auto flex-grow p-4 space-y-2">
        {bookings.length === 0 ? (
          <p className="text-center text-slate-400 py-8 text-sm">ไม่มีข้อมูล</p>
        ) : bookings.map(b => {
          const sc = STATUS_CONFIG[b.status] || STATUS_CONFIG['ยังไม่มา'];
          const newCust = patients ? isNewCustomer(b, patients) : false;
          const tier = b.hn && records ? getPatientTier(records, b.hn) : DEFAULT_TIER;
          return (
            <div key={b.id} onClick={() => { onClose(); onSelectBooking(b); }}
              className="bg-white p-3 rounded-2xl border-2 border-slate-100 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <p className="font-bold text-slate-800 text-sm truncate">{b.customerName || 'ไม่มีชื่อ'}</p>
                    {newCust && (
                      <span className="shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-700">
                        <UserPlus className="w-2.5 h-2.5" />ใหม่
                      </span>
                    )}
                    {b.hn && <MemberBadge tier={tier} size="xs" />}
                  </div>
                  {b.hn && <p className="text-[11px] text-blue-500 font-bold">HN: {b.hn}</p>}
                  <p className="text-xs text-slate-400 truncate mt-0.5">{b.procedure || '-'}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${sc.bg} ${sc.text}`}>{b.status}</span>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-blue-600 font-bold text-sm">{b.bookingTime ? `${b.bookingTime} น.` : '-'}</p>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 mt-1 ml-auto" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

// ─── CALENDAR VIEW COMPONENT ─────────────────────────────────────────────────
const CalendarView = ({ bookings, patients, onSelectDate, onAddBooking }) => {
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  const todayKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();

  const prevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y-1); } else setCalMonth(m => m-1); };
  const nextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y+1); } else setCalMonth(m => m+1); };
  const goToday = () => { setCalYear(today.getFullYear()); setCalMonth(today.getMonth()); };

  const bookingsByDate = {};
  bookings.forEach(b => {
    if (!bookingsByDate[b.bookingDate]) bookingsByDate[b.bookingDate] = [];
    bookingsByDate[b.bookingDate].push(b);
  });

  const cells = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm font-bold min-w-[130px] text-center">{MONTH_TH[calMonth]} {calYear + 543}</span>
          <button onClick={nextMonth} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"><ChevronRight className="w-4 h-4" /></button>
        </div>
        <button onClick={goToday} className="text-xs font-bold bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-colors">วันนี้</button>
      </div>
      <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-100">
        {DAY_TH_SHORT.map((d, i) => (
          <div key={i} className={`text-center py-2 text-xs font-bold ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-slate-500'}`}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
        {cells.map((day, idx) => {
          if (!day) return <div key={`e-${idx}`} className="min-h-[70px] sm:min-h-[90px] bg-slate-50/50" />;
          const dateKey = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const rawBookings = bookingsByDate[dateKey] || [];
          const dayBookings = [...rawBookings].sort((a, b) => (a.bookingTime || '').localeCompare(b.bookingTime || ''));
          const isToday = dateKey === todayKey;
          const colIdx = (firstDayOfWeek + day - 1) % 7;
          const isWeekend = colIdx === 0 || colIdx === 6;
          const activeBookings = dayBookings.filter(b => b.status !== 'ยกเลิกนัด' && b.status !== 'เลื่อนนัด');
          return (
            <div key={day} onClick={() => onSelectDate(dateKey)}
              className={`min-h-[70px] sm:min-h-[90px] p-1 cursor-pointer transition-all hover:bg-blue-50 group relative ${isToday ? 'bg-blue-50/70' : ''}`}>
              <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold mb-1
                ${isToday ? 'bg-blue-600 text-white' : isWeekend ? (colIdx===0?'text-red-500':'text-blue-500') : 'text-slate-700'}`}>{day}</div>
              <div className="space-y-0.5">
                {dayBookings.slice(0, 3).map((b, bi) => {
                  const sc = STATUS_CONFIG[b.status] || STATUS_CONFIG['ยังไม่มา'];
                  const newCust = isNewCustomer(b, patients);
                  return (
                    <div key={bi}
                      className={`text-[9px] sm:text-[10px] font-semibold px-1 py-0.5 rounded leading-tight flex items-center gap-0.5
                      ${newCust ? 'bg-amber-100 text-amber-800 border border-amber-300' : `${sc.bg} ${sc.text}`}`}>
                      {newCust && <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />}
                      <span className="truncate">{b.bookingTime} น. {b.customerName}</span>
                    </div>
                  );
                })}
                {dayBookings.length > 3 && <div className="text-[9px] text-slate-400 font-bold pl-0.5">+{dayBookings.length - 3} อื่นๆ</div>}
              </div>
              {activeBookings.length > 0 && (
                <div className="absolute top-1 right-1 w-4 h-4 bg-blue-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                  {activeBookings.length}
                </div>
              )}
              <button onClick={e => { e.stopPropagation(); onAddBooking(dateKey); }}
                className="absolute bottom-1 right-1 w-5 h-5 bg-blue-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-sm hover:bg-blue-600">
                <Plus className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Dashboard Tab ────────────────────────────────────────────────────────────
const DashboardTab = ({ bookings, patients, isOffline, initialBooking, onPendingBookingConsumed, records }) => {
  const [reportDate, setReportDate] = useState(todayStr());
  const [listModal, setListModal] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [editBooking, setEditBooking] = useState(null);
  const [addBooking, setAddBooking] = useState(null);
  const [viewMode, setViewMode] = useState('calendar');

  useEffect(() => {
    if (initialBooking) {
      setAddBooking(initialBooking);
      setViewMode('list');
      if (onPendingBookingConsumed) onPendingBookingConsumed();
    }
  }, [initialBooking]);

  const dayBookings = [...bookings.filter(b => b.bookingDate === reportDate)]
    .sort((a, b) => (a.bookingTime || '').localeCompare(b.bookingTime || ''));

  const byStatus = (s) => s === 'ทั้งหมด' ? dayBookings : dayBookings.filter(b => b.status === s);
  const byCall = (s) => dayBookings.filter(b => (b.callStatus || 'ยังไม่โทรคอนเฟิม') === s);

  const newCustomerBookings = dayBookings.filter(b => isNewCustomer(b, patients));
  const returningCustomerBookings = dayBookings.filter(b => !isNewCustomer(b, patients));

  const handleUpdateStatus = async (id, data) => {
    await updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'bookings', id), data);
  };
  const handleUpdateCallStatus = async (id, callStatus) => {
    await updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'bookings', id), { callStatus });
  };
  const handleSaveBooking = async (form) => {
    if (form.id) {
      const { id, ...data } = form;
      await updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'bookings', id), data);
    } else {
      await addDoc(BOOKINGS_PATH(), { ...form, createdAt: serverTimestamp() });
    }
    setEditBooking(null); setAddBooking(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">รายงานประจำวัน</h2>
          <p className="text-xs text-gray-500">สรุปข้อมูลการนัดหมายตามวันที่เลือก</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1">
            <button onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'calendar' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <Grid className="w-3.5 h-3.5" /> ปฏิทิน
            </button>
            <button onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <List className="w-3.5 h-3.5" /> รายการ
            </button>
          </div>
          <button onClick={() => setAddBooking(EMPTY_BOOKING(reportDate))}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm text-sm active:scale-95">
            <Plus className="w-4 h-4" /> เพิ่มคิว
          </button>
        </div>
      </div>

      {viewMode === 'calendar' && (
        <CalendarView bookings={bookings} patients={patients}
          onSelectDate={(d) => { setReportDate(d); setViewMode('list'); }}
          onAddBooking={(d) => setAddBooking(EMPTY_BOOKING(d))} />
      )}

      {viewMode === 'list' && (
        <>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-3 py-2 shadow-sm hover:border-blue-300 transition-colors">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg shrink-0"><Calendar className="w-4 h-4" /></div>
              <div className="flex flex-col">
                <label className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">วันที่ดูรายงาน</label>
                <input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)}
                  className="text-sm font-bold text-slate-800 outline-none bg-transparent cursor-pointer" />
              </div>
            </div>
            <button onClick={() => setViewMode('calendar')} className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-700 font-bold bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-xl transition-colors">
              <Grid className="w-3.5 h-3.5" /> ดูปฏิทิน
            </button>
          </div>

          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-2 px-1 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> ประเภทลูกค้าวันนี้
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div onClick={() => setListModal({ title: '✨ ลูกค้าใหม่', items: newCustomerBookings })}
                className="cursor-pointer hover:-translate-y-1 bg-gradient-to-br from-amber-50 to-orange-100 p-4 sm:p-5 rounded-2xl shadow-sm border border-amber-200 flex items-center gap-4 hover:shadow-lg transition-all group">
                <div className="p-3 bg-amber-400 text-white rounded-2xl shadow-sm shrink-0 group-hover:scale-110 transition-transform">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs uppercase font-bold text-amber-600 tracking-wider leading-tight">ลูกค้าใหม่</p>
                  <h3 className="text-3xl sm:text-4xl font-bold text-amber-800 leading-none mt-0.5">{newCustomerBookings.length}</h3>
                  <p className="text-[10px] text-amber-500 font-medium mt-0.5">{dayBookings.length > 0 ? Math.round((newCustomerBookings.length / dayBookings.length) * 100) : 0}% ของวัน</p>
                </div>
              </div>
              <div onClick={() => setListModal({ title: '⭐ ลูกค้าเก่า', items: returningCustomerBookings })}
                className="cursor-pointer hover:-translate-y-1 bg-gradient-to-br from-purple-50 to-violet-100 p-4 sm:p-5 rounded-2xl shadow-sm border border-purple-200 flex items-center gap-4 hover:shadow-lg transition-all group">
                <div className="p-3 bg-purple-500 text-white rounded-2xl shadow-sm shrink-0 group-hover:scale-110 transition-transform">
                  <Star className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs uppercase font-bold text-purple-600 tracking-wider leading-tight">ลูกค้าเก่า</p>
                  <h3 className="text-3xl sm:text-4xl font-bold text-purple-800 leading-none mt-0.5">{returningCustomerBookings.length}</h3>
                  <p className="text-[10px] text-purple-500 font-medium mt-0.5">{dayBookings.length > 0 ? Math.round((returningCustomerBookings.length / dayBookings.length) * 100) : 0}% ของวัน</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-2 px-1 flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-500" /> ประเภทสมาชิกวันนี้
            </p>
            <div className="grid grid-cols-5 gap-2">
              {TIER_KEYS.map(key => {
                const cfg = MEMBERSHIP_TIERS[key];
                const IconC = cfg.Icon;
                const count = dayBookings.filter(b => b.hn && getPatientTier(records, b.hn) === key).length;
                return (
                  <div key={key}
                    onClick={() => setListModal({ title: cfg.label, items: dayBookings.filter(b => b.hn && getPatientTier(records, b.hn) === key) })}
                    className={`cursor-pointer hover:-translate-y-0.5 bg-gradient-to-br ${cfg.gradient} p-2.5 sm:p-3 rounded-2xl border ${cfg.badgeBorder} shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center`}>
                    <div className={`p-2 ${cfg.iconBg} ${cfg.iconColor} rounded-xl mb-1.5 shadow-sm`}>
                      <IconC className="w-4 h-4" />
                    </div>
                    <p className={`text-[8px] sm:text-[10px] font-bold ${cfg.badgeText} leading-tight mb-0.5`}>{cfg.label}</p>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-800">{count}</h3>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-2 px-1 flex items-center gap-1.5">
              <CalendarCheck className="w-3.5 h-3.5" /> สถานะนัดหมาย
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
              <StatCard label="ทั้งหมด (รายวัน)" value={dayBookings.length} Icon={Users} bg="bg-blue-50" text="text-blue-600" onClick={() => setListModal({ title: 'ทั้งหมด', items: byStatus('ทั้งหมด') })} />
              <StatCard label="มาแล้ว" value={byStatus('มาแล้ว').length} Icon={CheckCircle} bg="bg-emerald-50" text="text-emerald-600" onClick={() => setListModal({ title: 'มาแล้ว', items: byStatus('มาแล้ว') })} />
              <StatCard label="ยังไม่มา" value={byStatus('ยังไม่มา').length} Icon={Clock} bg="bg-amber-50" text="text-amber-600" onClick={() => setListModal({ title: 'ยังไม่มา', items: byStatus('ยังไม่มา') })} />
              <StatCard label="เลื่อนนัด" value={byStatus('เลื่อนนัด').length} Icon={CalendarDays} bg="bg-indigo-50" text="text-indigo-600" onClick={() => setListModal({ title: 'เลื่อนนัด', items: byStatus('เลื่อนนัด') })} />
              <StatCard label="ไม่มาตามนัด" value={byStatus('ไม่มาตามนัด').length} Icon={UserX} bg="bg-rose-50" text="text-rose-600" onClick={() => setListModal({ title: 'ไม่มาตามนัด', items: byStatus('ไม่มาตามนัด') })} />
              <StatCard label="ยกเลิกนัด" value={byStatus('ยกเลิกนัด').length} Icon={XCircle} bg="bg-slate-100" text="text-slate-600" onClick={() => setListModal({ title: 'ยกเลิกนัด', items: byStatus('ยกเลิกนัด') })} />
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-2 px-1 flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5" /> สถานะการโทรยืนยัน
            </p>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <StatCard label="ยังไม่โทรคอนเฟิม" value={byCall('ยังไม่โทรคอนเฟิม').length} Icon={PhoneMissed} bg="bg-slate-100" text="text-slate-500" onClick={() => setListModal({ title: 'ยังไม่โทรคอนเฟิม', items: byCall('ยังไม่โทรคอนเฟิม') })} />
              <StatCard label="คอนเฟิมนัดแล้ว" value={byCall('คอนเฟิมนัดแล้ว').length} Icon={PhoneIncoming} bg="bg-emerald-50" text="text-emerald-600" onClick={() => setListModal({ title: 'คอนเฟิมนัดแล้ว', items: byCall('คอนเฟิมนัดแล้ว') })} />
              <StatCard label="ไม่รับสายรอโทรใหม่" value={byCall('ไม่รับสายรอโทรใหม่').length} Icon={PhoneOff} bg="bg-amber-50" text="text-amber-500" onClick={() => setListModal({ title: 'ไม่รับสายรอโทรใหม่', items: byCall('ไม่รับสายรอโทรใหม่') })} />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <h2 className="font-bold text-gray-800 text-sm">ตารางนัดหมายวันที่ {fmtDateTH(reportDate)}</h2>
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">{dayBookings.length} รายการ</span>
            </div>
            {dayBookings.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-8 h-8 text-blue-200" />
                </div>
                <p className="text-slate-400 text-sm font-medium">ไม่มีนัดหมายในวันนี้</p>
                <button onClick={() => setAddBooking(EMPTY_BOOKING(reportDate))}
                  className="mt-3 text-xs text-blue-500 font-bold hover:text-blue-700 flex items-center gap-1 mx-auto">
                  <Plus className="w-3.5 h-3.5" /> เพิ่มนัดหมาย
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {dayBookings.map((b, idx) => {
                  const sc = STATUS_CONFIG[b.status] || STATUS_CONFIG['ยังไม่มา'];
                  const cc = CALL_CONFIG[b.callStatus || 'ยังไม่โทรคอนเฟิม'];
                  const CallIcon = cc.icon;
                  const newCust = isNewCustomer(b, patients);
                  const tier = b.hn ? getPatientTier(records, b.hn) : DEFAULT_TIER;
                  const tierCfg = MEMBERSHIP_TIERS[tier] || MEMBERSHIP_TIERS[DEFAULT_TIER];
                  return (
                    <div key={b.id} onClick={() => setSelectedBooking(b)}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors group
                        ${newCust ? 'hover:bg-amber-50 border-l-2 border-amber-400' : 'hover:bg-slate-50 border-l-2 border-transparent'}`}>
                      <div className="text-slate-300 text-[10px] font-bold w-4 shrink-0 text-center">{idx + 1}</div>
                      <div className={`w-2 h-2 rounded-full shrink-0 ${sc.dot}`} />
                      <div className="text-blue-700 font-bold text-sm w-12 shrink-0">{b.bookingTime ? `${b.bookingTime} น.` : '?'}</div>
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className={`font-bold text-sm truncate transition-colors ${newCust ? 'text-amber-800 group-hover:text-amber-900' : 'text-slate-800 group-hover:text-blue-700'}`}>
                            {b.customerName}
                          </p>
                          {newCust ? (
                            <span className="shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-300">
                              <UserPlus className="w-2.5 h-2.5" /> ใหม่
                            </span>
                          ) : b.hn && (
                            <MemberBadge tier={tier} size="xs" />
                          )}
                        </div>
                        <p className="text-xs text-slate-400 truncate">{b.procedure || '-'}</p>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <CallIcon className={`w-3.5 h-3.5 ${cc.text}`} />
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>{b.status}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {listModal && <BookingListModal title={listModal.title} bookings={listModal.items} patients={patients} records={records} onClose={() => setListModal(null)} onSelectBooking={b => setSelectedBooking(b)} />}
      {selectedBooking && (
        <BookingDetailModal booking={selectedBooking} onClose={() => setSelectedBooking(null)}
          onUpdateStatus={handleUpdateStatus} onUpdateCallStatus={handleUpdateCallStatus}
          onEdit={b => setEditBooking(b)} patients={patients} allBookings={bookings} records={records} />
      )}
      {(editBooking || addBooking) && (
        <BookingFormModal booking={editBooking || addBooking} patients={patients} allBookings={bookings}
          onClose={() => { setEditBooking(null); setAddBooking(null); }} onSave={handleSaveBooking} isOffline={isOffline} />
      )}
    </div>
  );
};

// ─── Summary Tab ──────────────────────────────────────────────────────────────
const SummaryTab = ({ bookings }) => {
  const now = new Date();
  const firstDay = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
  const [start, setStart] = useState(firstDay);
  const [end, setEnd] = useState(todayStr());
  const [result, setResult] = useState(null);

  const generate = () => {
    const filtered = bookings.filter(b => b.bookingDate >= start && b.bookingDate <= end);
    const totals = { all: filtered.length, arrived: 0, upcoming: 0, rescheduled: 0, noShow: 0, cancelled: 0 };
    const byBooker = {};

    // ✅ Normalize key: strip ALL invisible unicode + Thai-invisible chars, trim, collapse spaces
    // Use lowercase key so "สเนล" and "สเนล " and "สเนล\u200B" all map to the same bucket
    const normalizeKey = (name) => (name || '')
      .replace(/[\u200B\u200C\u200D\uFEFF\u00A0\u2000-\u200A\u202F\u205F\u3000\t\r\n]/g, ' ')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();

    filtered.forEach(b => {
      const s = b.status || 'ยังไม่มา';
      if (s === 'มาแล้ว') totals.arrived++;
      else if (s === 'ยังไม่มา') totals.upcoming++;
      else if (s === 'เลื่อนนัด') totals.rescheduled++;
      else if (s === 'ไม่มาตามนัด') totals.noShow++;
      else if (s === 'ยกเลิกนัด') totals.cancelled++;

      const key = normalizeKey(b.bookerName) || 'ไม่ระบุ';
      // Store displayName from first occurrence (cleaned, but preserves original Thai case)
      if (!byBooker[key]) byBooker[key] = {
        displayName: (b.bookerName || '').replace(/[\u200B\u200C\u200D\uFEFF\u00A0]/g, '').trim().replace(/\s+/g, ' ') || 'ไม่ระบุ',
        total: 0, arrived: 0, upcoming: 0, rescheduled: 0, noShow: 0, cancelled: 0
      };
      byBooker[key].total++;
      if (s === 'มาแล้ว') byBooker[key].arrived++;
      else if (s === 'ยังไม่มา') byBooker[key].upcoming++;
      else if (s === 'เลื่อนนัด') byBooker[key].rescheduled++;
      else if (s === 'ไม่มาตามนัด') byBooker[key].noShow++;
      else if (s === 'ยกเลิกนัด') byBooker[key].cancelled++;
    });
    setResult({ totals, byBooker });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">สรุปผลการจอง</h2>
        <p className="text-xs text-gray-500 mt-1">รายงานสรุปการนัดหมายแยกตามช่วงเวลาและผู้นัด</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          {[{ label: 'วันที่เริ่มต้น', val: start, set: setStart }, { label: 'วันที่สิ้นสุด', val: end, set: setEnd }].map(({ label, val, set }) => (
            <div key={label} className="flex-1 w-full">
              <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>
              <input type="date" value={val} onChange={e => set(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          ))}
          <button onClick={generate} className="w-full sm:w-auto bg-blue-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-all flex justify-center items-center gap-2">
            <RefreshCw className="w-4 h-4" /> สร้างรายงาน
          </button>
        </div>
      </div>
      {result && (
        <>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
            <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-blue-600" /> สรุปรวมตามช่วงเวลา</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'นัดรวมทั้งหมด', val: result.totals.all, from: 'from-blue-50', to: 'to-blue-100', text: 'text-blue-700', small: 'text-blue-600' },
                { label: 'มาแล้ว', val: result.totals.arrived, from: 'from-emerald-50', to: 'to-emerald-100', text: 'text-emerald-700', small: 'text-emerald-600' },
                { label: 'ยังไม่มา', val: result.totals.upcoming, from: 'from-amber-50', to: 'to-amber-100', text: 'text-amber-700', small: 'text-amber-600' },
                { label: 'เลื่อนนัด', val: result.totals.rescheduled, from: 'from-indigo-50', to: 'to-indigo-100', text: 'text-indigo-700', small: 'text-indigo-600' },
                { label: 'ไม่มาตามนัด', val: result.totals.noShow, from: 'from-rose-50', to: 'to-rose-100', text: 'text-rose-700', small: 'text-rose-600' },
                { label: 'ยกเลิกนัด', val: result.totals.cancelled, from: 'from-slate-50', to: 'to-slate-100', text: 'text-slate-700', small: 'text-slate-600' },
              ].map(({ label, val, from, to, text, small }) => (
                <div key={label} className={`bg-gradient-to-br ${from} ${to} p-4 rounded-xl`}>
                  <p className={`text-xs ${small} font-bold mb-1`}>{label}</p>
                  <p className={`text-2xl font-bold ${text}`}>{val}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2"><UsersRound className="w-5 h-5 text-blue-600" /> ผลการนัดแยกตามผู้นัด</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    {['ชื่อผู้นัด', 'นัดทั้งหมด', 'มาแล้ว', 'ยังไม่มา', 'เลื่อนนัด', 'ไม่มานัด', 'ยกเลิก', '% มาแล้ว'].map(h => (
                      <th key={h} className="px-3 py-3 text-left text-xs font-bold text-slate-500 border-b-2 border-slate-200 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(result.byBooker).sort(([,a],[,b]) => a.displayName.localeCompare(b.displayName, 'th')).map(([key, s]) => {
                    const pct = s.total > 0 ? ((s.arrived / s.total) * 100).toFixed(1) : '0.0';
                    const pctNum = parseFloat(pct);
                    const pctColor = pctNum >= 70 ? 'bg-emerald-100 text-emerald-700' : pctNum >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700';
                    return (
                      <tr key={key} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-3 py-3 font-bold text-gray-800 text-sm whitespace-nowrap">{s.displayName}</td>
                        <td className="px-3 py-3 text-center font-bold text-blue-600 text-sm">{s.total}</td>
                        <td className="px-3 py-3 text-center text-emerald-600 text-sm">{s.arrived}</td>
                        <td className="px-3 py-3 text-center text-amber-600 text-sm">{s.upcoming}</td>
                        <td className="px-3 py-3 text-center text-indigo-600 text-sm">{s.rescheduled}</td>
                        <td className="px-3 py-3 text-center text-rose-600 text-sm">{s.noShow}</td>
                        <td className="px-3 py-3 text-center text-slate-600 text-sm">{s.cancelled}</td>
                        <td className="px-3 py-3 text-center"><span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${pctColor}`}>{pct}%</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Patient Records ──────────────────────────────────────────────────────────
const PatientsTab = ({ records, user, isOffline, onAddBookingForPatient }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [patientModalHN, setPatientModalHN] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [alertMessage, setAlertMessage] = useState('');
  const [lightbox, setLightbox] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const touchStartX = useRef(null);
  const fileBeforeRef = useRef(null);
  const fileAfterRef = useRef(null);
  const today = todayStr();
  const [formData, setFormData] = useState(EMPTY_RECORD(today));
  const [beforeFiles, setBeforeFiles] = useState([]);
  const [beforePreviews, setBeforePreviews] = useState([]);
  const [afterFiles, setAfterFiles] = useState([]);
  const [afterPreviews, setAfterPreviews] = useState([]);
  const [editBeforeImages, setEditBeforeImages] = useState([]);
  const [editAfterImages, setEditAfterImages] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState('search');
  const [addProcPatient, setAddProcPatient] = useState(null);
  const [procForm, setProcForm] = useState({ serviceDate: today, service: '', price: '', note: '' });
  const [procBefore, setProcBefore] = useState([]); const [procBeforePrev, setProcBeforePrev] = useState([]);
  const [procAfter, setProcAfter] = useState([]);  const [procAfterPrev, setProcAfterPrev] = useState([]);
  const [procStaff, setProcStaff] = useState({ sale: '', assistant: '', appointedBy: '', doctor: '' });
  const [procSubmitting, setProcSubmitting] = useState(false);
  const procBeforeRef = useRef(null);
  const procAfterRef = useRef(null);
  const [editPatientHN, setEditPatientHN] = useState(null);
  const [editPatientForm, setEditPatientForm] = useState({ fullName: '', phone: '' });
  const [editPatientSaving, setEditPatientSaving] = useState(false);
  const [membershipSelectorHN, setMembershipSelectorHN] = useState(null);
  const [tierFilterKey, setTierFilterKey] = useState('all');

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

  const groupedMap = new Map();
  records.forEach(r => {
    if (!groupedMap.has(r.hn)) groupedMap.set(r.hn, { hn: r.hn, fullName: r.fullName, phone: r.phone, latestDate: r.serviceDate, count: 1, records: [r], membershipTier: r.membershipTier || DEFAULT_TIER });
    else {
      const p = groupedMap.get(r.hn);
      p.count++; p.records.push(r);
      if (new Date(r.serviceDate) > new Date(p.latestDate)) p.latestDate = r.serviceDate;
      if (r.membershipTier && MEMBERSHIP_TIERS[r.membershipTier]) p.membershipTier = r.membershipTier;
    }
  });
  const allPatients = Array.from(groupedMap.values()).sort((a, b) => new Date(b.latestDate) - new Date(a.latestDate));

  const filteredPatients = allPatients.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = (p.fullName || '').toLowerCase().includes(q) || (p.hn || '').toLowerCase().includes(q) || (p.phone || '').includes(q);
    const matchesTier = tierFilterKey === 'all' || p.membershipTier === tierFilterKey;
    return matchesSearch && matchesTier;
  });

  const modalPatient = patientModalHN ? groupedMap.get(patientModalHN) : null;

  const compressImage = (file) => new Promise(resolve => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = ev => {
      const img = new Image();
      img.src = ev.target.result;
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

  const handleInputChange = (e) => { const { name, value } = e.target; setFormData(p => ({ ...p, [name]: value })); };

  const handleImageAdd = (e, type) => {
    const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
    const curr = type === 'before'
      ? (editingRecord ? editBeforeImages.length : 0) + beforeFiles.length
      : (editingRecord ? editAfterImages.length : 0) + afterFiles.length;
    if (curr + files.length > 5) { setAlertMessage('สามารถอัปโหลดได้สูงสุด 5 รูปต่อประเภท'); return; }
    if (type === 'before') {
      setBeforeFiles(p => [...p, ...files]);
      files.forEach(f => { const r = new FileReader(); r.onloadend = () => setBeforePreviews(p => [...p, r.result]); r.readAsDataURL(f); });
    } else {
      setAfterFiles(p => [...p, ...files]);
      files.forEach(f => { const r = new FileReader(); r.onloadend = () => setAfterPreviews(p => [...p, r.result]); r.readAsDataURL(f); });
    }
    e.target.value = '';
  };

  const removeNewImage = (type, idx) => {
    if (type === 'before') { setBeforeFiles(p => p.filter((_, i) => i !== idx)); setBeforePreviews(p => p.filter((_, i) => i !== idx)); }
    else { setAfterFiles(p => p.filter((_, i) => i !== idx)); setAfterPreviews(p => p.filter((_, i) => i !== idx)); }
  };

  const resetImages = () => { setBeforeFiles([]); setBeforePreviews([]); setAfterFiles([]); setAfterPreviews([]); setEditBeforeImages([]); setEditAfterImages([]); };

  const resetProc = () => { setProcForm({ serviceDate: today, service: '', price: '', note: '' }); setProcStaff({ sale: '', assistant: '', appointedBy: '', doctor: '' }); setProcBefore([]); setProcBeforePrev([]); setProcAfter([]); setProcAfterPrev([]); };

  const handleProcImageAdd = (e, type) => {
    const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
    const curr = type === 'before' ? procBefore.length : procAfter.length;
    if (curr + files.length > 5) { setAlertMessage('สามารถอัปโหลดได้สูงสุด 5 รูปต่อประเภท'); return; }
    if (type === 'before') {
      setProcBefore(p => [...p, ...files]);
      files.forEach(f => { const r = new FileReader(); r.onloadend = () => setProcBeforePrev(p => [...p, r.result]); r.readAsDataURL(f); });
    } else {
      setProcAfter(p => [...p, ...files]);
      files.forEach(f => { const r = new FileReader(); r.onloadend = () => setProcAfterPrev(p => [...p, r.result]); r.readAsDataURL(f); });
    }
    e.target.value = '';
  };

  const handleProcSubmit = async () => {
    if (!procForm.service || !procForm.serviceDate) return;
    setProcSubmitting(true);
    try {
      const b64Before = await Promise.all(procBefore.map(f => compressImage(f)));
      const b64After  = await Promise.all(procAfter.map(f => compressImage(f)));
      await addDoc(RECORDS_PATH(), {
        fullName: addProcPatient.fullName, hn: addProcPatient.hn, phone: addProcPatient.phone || '',
        membershipTier: addProcPatient.membershipTier || DEFAULT_TIER,
        serviceDate: procForm.serviceDate, service: procForm.service,
        price: procForm.price ? Number(procForm.price) : null,
        note: procForm.note || '',
        sale: procStaff.sale || '', assistant: procStaff.assistant || '',
        appointedBy: procStaff.appointedBy || '', doctor: procStaff.doctor || '',
        imagesBefore: b64Before, imagesAfter: b64After, images: [],
        createdBy: user?.uid || 'anonymous', createdAt: serverTimestamp(),
      });
      resetProc();
      setAddProcPatient(null);
    } catch (err) { setAlertMessage('เกิดข้อผิดพลาด: ' + err.message); }
    finally { setProcSubmitting(false); }
  };

  const saveEditPatient = async () => {
    if (!editPatientHN || !editPatientForm.fullName) return;
    setEditPatientSaving(true);
    try {
      const toUpdate = records.filter(r => r.hn === editPatientHN);
      await Promise.all(toUpdate.map(r =>
        updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'patient_records', r.id), {
          fullName: editPatientForm.fullName.trim(),
          phone: editPatientForm.phone.trim(),
        })
      ));
      setEditPatientHN(null);
    } catch (err) { setAlertMessage('เกิดข้อผิดพลาด: ' + err.message); }
    finally { setEditPatientSaving(false); }
  };

  const saveMembershipTier = async (hn, newTier) => {
    const toUpdate = records.filter(r => r.hn === hn);
    await Promise.all(toUpdate.map(r =>
      updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'patient_records', r.id), { membershipTier: newTier })
    ));
  };

  const staffRequired = !formData.sale || !formData.assistant || !formData.doctor;

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.hn || !formData.service || !formData.serviceDate || staffRequired) return;
    setSubmitting(true);
    try {
      const b64Before = await Promise.all(beforeFiles.map(f => compressImage(f)));
      const b64After = await Promise.all(afterFiles.map(f => compressImage(f)));
      const updated = {
        fullName: formData.fullName, hn: formData.hn, phone: formData.phone || '',
        serviceDate: formData.serviceDate, service: formData.service,
        price: formData.price ? Number(formData.price) : null, note: formData.note || '',
        sale: formData.sale || '', assistant: formData.assistant || '',
        appointedBy: formData.appointedBy || '', doctor: formData.doctor || '',
        imagesBefore: [...editBeforeImages, ...b64Before],
        imagesAfter: [...editAfterImages, ...b64After], images: [],
      };
      if (db && !isOffline) await updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'patient_records', editingRecord.id), updated);
      setEditingRecord(null); setFormData(EMPTY_RECORD(today)); resetImages();
      setAlertMessage("บันทึกการแก้ไขข้อมูลสำเร็จ ✓");
    } catch (error) { setAlertMessage("เกิดข้อผิดพลาด: " + error.message); }
    finally { setSubmitting(false); }
  };

  const confirmDelete = async (id) => {
    try {
      if (!String(id).startsWith('local-') && !isOffline && db)
        await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'patient_records', id));
    } catch (error) { setAlertMessage("ไม่สามารถลบข้อมูลได้: " + error.message); }
    setRecordToDelete(null);
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    setFormData({ fullName: record.fullName, hn: record.hn, phone: record.phone || '', serviceDate: record.serviceDate, service: record.service, price: record.price || '', note: record.note || '', sale: record.sale || '', assistant: record.assistant || '', appointedBy: record.appointedBy || '', doctor: record.doctor || '' });
    setEditBeforeImages(record.imagesBefore || record.images || []);
    setEditAfterImages(record.imagesAfter || []);
    setBeforeFiles([]); setBeforePreviews([]); setAfterFiles([]); setAfterPreviews([]);
  };

  const tierCounts = { all: allPatients.length };
  TIER_KEYS.forEach(k => { tierCounts[k] = allPatients.filter(p => p.membershipTier === k).length; });

  return (
    <div>
      <input type="file" ref={fileBeforeRef} onChange={e => handleImageAdd(e, 'before')} accept="image/*" multiple className="hidden" />
      <input type="file" ref={fileAfterRef} onChange={e => handleImageAdd(e, 'after')} accept="image/*" multiple className="hidden" />

      <div className="flex gap-1 bg-purple-50 p-1 rounded-2xl mb-6">
        <button onClick={() => setActiveSubTab('search')} className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeSubTab === 'search' ? 'bg-white text-purple-700 shadow-sm' : 'text-purple-400 hover:text-purple-600'}`}>
          <Search className="w-4 h-4" /> ค้นหาประวัติลูกค้า
        </button>
        <button onClick={() => { setActiveSubTab('add'); setFormData(EMPTY_RECORD(today)); resetImages(); }} className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeSubTab === 'add' ? 'bg-white text-purple-700 shadow-sm' : 'text-purple-400 hover:text-purple-600'}`}>
          <Plus className="w-4 h-4" /> บันทึกประวัติใหม่
        </button>
      </div>

      {activeSubTab === 'add' && (
        <div className="bg-white rounded-2xl shadow-xl border border-purple-100 overflow-hidden max-w-md mx-auto">
          <div className="bg-gradient-to-r from-purple-700 to-purple-500 px-6 py-4 flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl"><UserPlus className="w-5 h-5 text-white" /></div>
            <div>
              <h2 className="text-base font-bold text-white">ลงทะเบียนลูกค้าใหม่</h2>
              <p className="text-purple-200 text-[11px]">บันทึกข้อมูลเข้าระบบประวัติลูกค้า</p>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {[
              { name: 'fullName', label: 'ชื่อ-นามสกุล', Icon: User, req: true, ph: 'เช่น สมหญิง สวยงาม' },
              { name: 'hn', label: 'เลข HN', Icon: Hash, req: true, ph: 'HN12345' },
              { name: 'phone', label: 'เบอร์โทรศัพท์', Icon: Phone, req: false, ph: '08X-XXX-XXXX', type: 'tel' },
            ].map(({ name, label, Icon, req, ph, type }) => (
              <div key={name}>
                <label className="block text-sm font-semibold text-purple-900 mb-1.5">{label} {req && <span className="text-red-500">*</span>}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Icon className="h-4 w-4 text-purple-400" /></div>
                  <input type={type || 'text'} name={name} value={formData[name]} onChange={handleInputChange} required={req} placeholder={ph}
                    className="pl-10 w-full rounded-xl border border-purple-200 focus:border-purple-500 focus:ring focus:ring-purple-200 px-3 py-2.5 text-sm text-slate-700" />
                </div>
              </div>
            ))}
            <div>
              <label className="block text-sm font-semibold text-purple-900 mb-1.5 flex items-center gap-1.5"><Crown className="w-4 h-4 text-amber-500" /> ประเภทสมาชิก</label>
              <div className="grid grid-cols-1 gap-1.5">
                {TIER_KEYS.map(key => {
                  const cfg = MEMBERSHIP_TIERS[key];
                  const IconC = cfg.Icon;
                  const isSelected = (formData.membershipTier || DEFAULT_TIER) === key;
                  return (
                    <button key={key} type="button"
                      onClick={() => setFormData(f => ({ ...f, membershipTier: key }))}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-left transition-all text-sm font-bold
                        ${isSelected ? `bg-gradient-to-r ${cfg.gradient} ${cfg.badgeBorder} text-slate-800` : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}>
                      <IconC className={`w-4 h-4 shrink-0 ${isSelected ? cfg.badgeText : 'text-slate-300'}`} />
                      {cfg.label}
                      {isSelected && <span className="ml-auto text-[10px] text-emerald-600 font-bold">✓ เลือกแล้ว</span>}
                    </button>
                  );
                })}
              </div>
            </div>
            <button
              onClick={async () => {
                if (!formData.fullName || !formData.hn) return;
                setSubmitting(true);
                try {
                  await addDoc(RECORDS_PATH(), {
                    fullName: formData.fullName.trim(),
                    hn: formData.hn.trim(),
                    phone: formData.phone?.trim() || '',
                    membershipTier: formData.membershipTier || DEFAULT_TIER,
                    serviceDate: today,
                    service: 'ลงทะเบียนลูกค้าใหม่',
                    price: null, note: '', sale: '', assistant: '', appointedBy: '', doctor: '',
                    imagesBefore: [], imagesAfter: [], images: [],
                    createdBy: user?.uid || 'anonymous',
                    createdAt: serverTimestamp(),
                  });
                  setFormData(EMPTY_RECORD(today));
                  setActiveSubTab('search');
                } catch (err) { setAlertMessage('เกิดข้อผิดพลาด: ' + err.message); }
                finally { setSubmitting(false); }
              }}
              disabled={submitting || !formData.fullName || !formData.hn}
              className={`w-full py-3 px-4 rounded-xl text-white font-bold shadow-md transition-all flex justify-center items-center gap-2
                ${submitting || !formData.fullName || !formData.hn ? 'bg-purple-300 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:shadow-lg active:scale-[0.98]'}`}>
              {submitting ? <><Sparkles className="animate-spin w-4 h-4" /> กำลังบันทึก...</> : <><UserPlus className="w-4 h-4" /> ลงทะเบียน</>}
            </button>
          </div>
        </div>
      )}

      {activeSubTab === 'search' && (
        <div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-purple-100 mb-4">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Search className="h-5 w-5 text-purple-400" /></div>
              <input type="text" placeholder="ค้นหาลูกค้าด้วย ชื่อ, เบอร์โทรศัพท์ หรือ รหัส HN..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="pl-12 w-full rounded-xl border border-purple-100 bg-purple-50/50 focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all px-4 py-3.5 text-slate-700" />
              {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-4 flex items-center text-purple-400 hover:text-purple-600"><X className="h-5 w-5 bg-purple-100 rounded-full p-0.5" /></button>}
            </div>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4" style={{ scrollbarWidth: 'none' }}>
            <button
              onClick={() => setTierFilterKey('all')}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all
                ${tierFilterKey === 'all' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-500 border-slate-200 hover:border-purple-300'}`}>
              <Users className="w-3.5 h-3.5" /> ทั้งหมด
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${tierFilterKey === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>{tierCounts.all}</span>
            </button>
            {TIER_KEYS.map(key => {
              const cfg = MEMBERSHIP_TIERS[key];
              const IconC = cfg.Icon;
              const isActive = tierFilterKey === key;
              return (
                <button key={key}
                  onClick={() => setTierFilterKey(key)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all
                    ${isActive ? `bg-gradient-to-r ${cfg.gradient} ${cfg.badgeBorder} text-slate-800 shadow-sm` : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                  <IconC className={`w-3.5 h-3.5 ${isActive ? cfg.badgeText : 'text-slate-400'}`} />
                  {cfg.label}
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isActive ? cfg.badgeBg + ' ' + cfg.badgeText : 'bg-slate-100 text-slate-500'}`}>{tierCounts[key] || 0}</span>
                </button>
              );
            })}
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
              {filteredPatients.map(patient => {
                const totalSpend = patient.records.reduce((s, r) => s + (r.price || 0), 0);
                const totalImages = patient.records.reduce((s, r) => s + getRecordImages(r).length, 0);
                const tierCfg = MEMBERSHIP_TIERS[patient.membershipTier] || MEMBERSHIP_TIERS[DEFAULT_TIER];
                return (
                  <div key={patient.hn} className={`bg-white rounded-2xl border-2 hover:shadow-md transition-all group ${tierCfg.badgeBorder} hover:border-purple-300`}>
                    <div className="px-4 py-3.5 flex items-center gap-3">
                      <div onClick={() => setPatientModalHN(patient.hn)}
                        className={`w-11 h-11 ${tierCfg.iconBg} rounded-full flex items-center justify-center shrink-0 transition-all duration-200 cursor-pointer shadow-sm`}>
                        {React.createElement(tierCfg.Icon, { className: `w-5 h-5 ${tierCfg.iconColor}` })}
                      </div>
                      <div className="flex-grow min-w-0 cursor-pointer" onClick={() => setPatientModalHN(patient.hn)}>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-sm font-bold text-slate-800 group-hover:text-purple-700 transition-colors truncate">{patient.fullName}</h3>
                          <MemberBadge tier={patient.membershipTier} size="xs" />
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 mt-0.5">
                          <span className="flex items-center text-[11px] text-slate-400 font-medium"><Hash className="w-2.5 h-2.5 mr-0.5 text-purple-300" />{patient.hn}</span>
                          {patient.phone && <><span className="text-slate-200">·</span><span className="flex items-center text-[11px] text-slate-400 font-medium"><Phone className="w-2.5 h-2.5 mr-0.5 text-purple-300" />{patient.phone}</span></>}
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <div className="text-right cursor-pointer" onClick={() => setPatientModalHN(patient.hn)}>
                          {totalSpend > 0 ? <p className="text-base font-bold text-green-600 leading-tight">{fmtMoney(totalSpend)}</p> : <p className="text-xs text-slate-300 font-medium">-</p>}
                          <div className="flex items-center justify-end gap-1 mt-0.5">
                            <span className="text-[11px] text-slate-400">{patient.count} ครั้ง</span>
                            {totalImages > 0 && <><span className="text-slate-200">·</span><ImageIcon className="w-2.5 h-2.5 text-purple-300" /><span className="text-[11px] text-slate-400">{totalImages}</span></>}
                          </div>
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); setMembershipSelectorHN(patient.hn); }}
                          className="p-2 text-slate-300 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-colors shrink-0"
                          title="เปลี่ยนประเภทสมาชิก">
                          <Crown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); setEditPatientHN(patient.hn); setEditPatientForm({ fullName: patient.fullName, phone: patient.phone || '' }); }}
                          className="p-2 text-slate-300 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-colors shrink-0">
                          <FileEdit className="w-4 h-4" />
                        </button>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-purple-500 transition-colors cursor-pointer" onClick={() => setPatientModalHN(patient.hn)} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Patient Modal */}
      {patientModalHN && modalPatient && (() => {
        const allSorted = [...modalPatient.records].sort((a, b) => new Date(b.serviceDate) - new Date(a.serviceDate));
        const allBefore = allSorted.flatMap(r => (r.imagesBefore || r.images || []).map(src => ({ src, record: r })));
        const allAfter = allSorted.flatMap(r => (r.imagesAfter || []).map(src => ({ src, record: r })));
        const totalSpend = modalPatient.records.reduce((s, r) => s + (r.price || 0), 0);
        const totalImages = allBefore.length + allAfter.length;
        const tier = modalPatient.membershipTier || DEFAULT_TIER;
        const tierCfg = MEMBERSHIP_TIERS[tier] || MEMBERSHIP_TIERS[DEFAULT_TIER];

        const CarouselRow = ({ items, label, labelColor }) => items.length === 0 ? null : (
          <div className="mb-2">
            <p className={`text-[11px] font-bold uppercase tracking-wider mb-1.5 ${labelColor}`}>{label} · {items.length} รูป</p>
            <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {items.map(({ src, record }, i) => (
                <div key={i} className="relative shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden cursor-pointer group/thumb bg-slate-100"
                  onClick={() => setLightbox({ images: items.map(x => x.src), index: i })}>
                  <img src={src} alt="" className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-300" loading="lazy" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 py-1">
                    <p className="text-white text-[9px] font-semibold truncate">{fmt(record.serviceDate)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

        return (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center" onClick={() => setPatientModalHN(null)}>
            <div className="bg-[#f8f7fc] w-full sm:max-w-3xl sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden" style={{ maxHeight: '92vh' }} onClick={e => e.stopPropagation()}>
              <div className={`bg-gradient-to-br ${tierCfg.headerGradient} px-5 pt-5 pb-4 shrink-0`}>
                <div className="w-10 h-1 bg-white/30 rounded-full mx-auto mb-4 sm:hidden" />
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center border border-white/20 shrink-0">
                      {React.createElement(tierCfg.Icon, { className: 'w-7 h-7 text-white' })}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <h2 className="text-xl font-bold text-white leading-tight">{modalPatient.fullName}</h2>
                        <MemberBadge tier={tier} size="sm" />
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 mt-0.5">
                        <span className="flex items-center text-white/80 text-xs font-medium"><Hash className="w-3 h-3 mr-0.5" />{modalPatient.hn}</span>
                        {modalPatient.phone && <span className="flex items-center text-white/80 text-xs font-medium"><Phone className="w-3 h-3 mr-0.5" />{modalPatient.phone}</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="bg-white/15 text-white text-xs font-semibold px-2.5 py-1 rounded-lg">{modalPatient.count} ครั้ง</span>
                        {totalSpend > 0 && <span className="bg-green-400/20 text-green-200 text-xs font-bold px-2.5 py-1 rounded-lg border border-green-400/20">รวม {fmtMoney(totalSpend)}</span>}
                        {totalImages > 0 && <span className="bg-white/15 text-white text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center"><ImageIcon className="w-3 h-3 mr-1" />{totalImages} รูป</span>}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setPatientModalHN(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors shrink-0"><X className="w-5 h-5 text-white" /></button>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <button onClick={() => { resetProc(); setProcForm(f => ({ ...f, serviceDate: today })); setAddProcPatient({ fullName: modalPatient.fullName, hn: modalPatient.hn, phone: modalPatient.phone || '', membershipTier: tier }); setPatientModalHN(null); }}
                    className="bg-white text-purple-700 hover:bg-purple-50 text-sm font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center shadow-sm">
                    <Plus className="w-4 h-4 mr-2" /> เพิ่มประวัติ
                  </button>
                  <button onClick={() => { onAddBookingForPatient(modalPatient); setPatientModalHN(null); }}
                    className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center shadow-sm">
                    <CalendarPlus className="w-4 h-4 mr-2" /> นัดหมายใหม่
                  </button>
                  <button onClick={() => { setMembershipSelectorHN(modalPatient.hn); setPatientModalHN(null); }}
                    className="bg-amber-400 hover:bg-amber-500 text-white text-sm font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center shadow-sm">
                    <Crown className="w-4 h-4 mr-2" /> เปลี่ยน Tier
                  </button>
                </div>
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
                    {allSorted.map((record, idx) => {
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
                                    <span className="text-[11px] text-slate-400 font-medium flex items-center"><Calendar className="w-2.5 h-2.5 mr-0.5 text-purple-300" />{fmt(record.serviceDate)}</span>
                                  </div>
                                  <p className="text-sm font-bold text-slate-800 leading-snug truncate">{record.service}</p>
                                  {record.note && <p className="text-[11px] text-slate-400 mt-0.5 truncate">📝 {record.note}</p>}
                                  {(recBefore.length > 0 || recAfter.length > 0) && (
                                    <div className="flex gap-1.5 mt-1">
                                      {recBefore.length > 0 && <span className="text-[10px] font-bold bg-red-50 text-red-500 border border-red-200 px-1.5 py-0.5 rounded-md">🔴 ก่อน {recBefore.length}</span>}
                                      {recAfter.length > 0 && <span className="text-[10px] font-bold bg-green-50 text-green-600 border border-green-200 px-1.5 py-0.5 rounded-md">🟢 หลัง {recAfter.length}</span>}
                                    </div>
                                  )}
                                  {(record.doctor || record.sale) && (
                                    <div className="flex flex-wrap gap-x-3 mt-1.5">
                                      {record.doctor && <span className="flex items-center text-[11px] text-slate-500"><Stethoscope className="w-2.5 h-2.5 mr-0.5 text-purple-400" />{record.doctor}</span>}
                                      {record.sale && <span className="flex items-center text-[11px] text-slate-500"><ShoppingBag className="w-2.5 h-2.5 mr-0.5 text-purple-400" />{record.sale}</span>}
                                      {record.assistant && <span className="flex items-center text-[11px] text-slate-500"><Users className="w-2.5 h-2.5 mr-0.5 text-purple-400" />{record.assistant}</span>}
                                    </div>
                                  )}
                                </div>
                                <div className="shrink-0 text-right">
                                  {record.price && <p className="text-sm font-bold text-green-700">{fmtMoney(record.price)}</p>}
                                  <div className="flex items-center justify-end gap-0.5 mt-1">
                                    <button onClick={() => { openEditModal(record); setPatientModalHN(null); }} className="p-1.5 text-slate-300 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"><FileEdit className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => { setRecordToDelete(record.id); setPatientModalHN(null); }} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
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

      {/* Membership Selector Modal */}
      {membershipSelectorHN && (() => {
        const patient = groupedMap.get(membershipSelectorHN);
        if (!patient) return null;
        return (
          <MembershipSelectorModal
            currentTier={patient.membershipTier || DEFAULT_TIER}
            patientName={patient.fullName}
            onClose={() => setMembershipSelectorHN(null)}
            onSave={async (newTier) => {
              await saveMembershipTier(membershipSelectorHN, newTier);
              setMembershipSelectorHN(null);
            }}
          />
        );
      })()}

      {/* Edit Record Modal */}
      {editingRecord && (
        <div className="fixed inset-0 bg-purple-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 pt-10">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-4 flex items-center justify-between text-white shrink-0 rounded-t-2xl">
              <h2 className="text-lg font-bold flex items-center"><FileEdit className="w-5 h-5 mr-2 text-blue-200" /> แก้ไขประวัติหัตถการ</h2>
              <button onClick={() => { setEditingRecord(null); setFormData(EMPTY_RECORD(today)); resetImages(); }} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="overflow-y-auto p-6 flex-grow">
              <form id="editRecordForm" onSubmit={handleUpdate} className="space-y-4">
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider border-b pb-1">รายละเอียดหัตถการ</h3>
                  {[
                    { name: 'serviceDate', label: 'วันที่เข้ารับบริการ', type: 'date', req: true },
                    { name: 'service', label: 'รายการหัตถการ', type: 'text', req: true },
                    { name: 'price', label: 'ราคา (บาท)', type: 'number', req: false },
                  ].map(({ name, label, type, req }) => (
                    <div key={name}>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">{label} {req && <span className="text-red-500">*</span>}</label>
                      <input type={type} name={name} value={formData[name]} onChange={handleInputChange} required={req} min={type === 'number' ? '0' : undefined}
                        className="w-full rounded-lg border border-slate-200 focus:border-blue-500 focus:ring focus:ring-blue-200 px-3 py-2 text-sm text-slate-700 bg-gray-50/50" />
                    </div>
                  ))}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">หมายเหตุเพิ่มเติม</label>
                    <textarea name="note" value={formData.note} onChange={handleInputChange} rows="2"
                      className="w-full rounded-lg border border-slate-200 focus:border-blue-500 focus:ring focus:ring-blue-200 px-3 py-2 text-sm text-slate-700 bg-gray-50/50 resize-none" />
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
              <button type="button" onClick={() => { setEditingRecord(null); setFormData(EMPTY_RECORD(today)); resetImages(); }} className="px-5 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-200 transition-colors">ยกเลิก</button>
              <button type="submit" form="editRecordForm" disabled={submitting || !formData.service || !formData.serviceDate || staffRequired}
                className={`px-6 py-2.5 rounded-xl text-white font-bold shadow-md transition-all flex items-center ${submitting || !formData.service || !formData.serviceDate || staffRequired ? 'bg-blue-300 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:shadow-lg active:scale-[0.98]'}`}>
                {submitting ? <><Sparkles className="animate-spin w-5 h-5 mr-2" /> กำลังบันทึก...</> : 'บันทึกการแก้ไข'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Procedure Modal */}
      {addProcPatient && (
        <>
          <input type="file" ref={procBeforeRef} onChange={e => handleProcImageAdd(e,'before')} accept="image/*" multiple className="hidden" />
          <input type="file" ref={procAfterRef}  onChange={e => handleProcImageAdd(e,'after')}  accept="image/*" multiple className="hidden" />
          <div className="fixed inset-0 bg-purple-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh]">
              <div className="bg-gradient-to-r from-purple-700 to-purple-500 px-6 py-4 flex items-center justify-between text-white shrink-0 rounded-t-3xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl"><FileEdit className="w-5 h-5" /></div>
                  <div>
                    <h2 className="text-base font-bold leading-tight">เพิ่มประวัติหัตถการ</h2>
                    <div className="flex items-center gap-2">
                      <p className="text-purple-200 text-[11px]">{addProcPatient.fullName} · {addProcPatient.hn}</p>
                      <MemberBadge tier={addProcPatient.membershipTier} size="xs" />
                    </div>
                  </div>
                </div>
                <button onClick={() => { setAddProcPatient(null); resetProc(); }} className="p-1.5 hover:bg-white/20 rounded-full transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="overflow-y-auto flex-grow p-5 space-y-4">
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider border-b pb-1">รายละเอียดหัตถการ</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">วันที่ <span className="text-red-500">*</span></label>
                      <input type="date" value={procForm.serviceDate} onChange={e => setProcForm(f => ({ ...f, serviceDate: e.target.value }))} required
                        className="w-full rounded-xl border border-purple-200 focus:border-purple-500 focus:ring focus:ring-purple-200 px-3 py-2 text-sm text-slate-700" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">ยอดชำระ (บาท)</label>
                      <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><DollarSign className="h-4 w-4 text-purple-400" /></div>
                        <input type="number" value={procForm.price} onChange={e => setProcForm(f => ({ ...f, price: e.target.value }))} min="0" placeholder="ไม่ระบุ"
                          className="pl-10 w-full rounded-xl border border-purple-200 focus:border-purple-500 focus:ring focus:ring-purple-200 px-3 py-2 text-sm text-slate-700" /></div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">รายการหัตถการ <span className="text-red-500">*</span></label>
                    <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FileText className="h-4 w-4 text-purple-400" /></div>
                      <input type="text" value={procForm.service} onChange={e => setProcForm(f => ({ ...f, service: e.target.value }))} required placeholder="เช่น ฉีดโบท็อกซ์กราม"
                        className="pl-10 w-full rounded-xl border border-purple-200 focus:border-purple-500 focus:ring focus:ring-purple-200 px-3 py-2 text-sm text-slate-700" /></div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">หมายเหตุ</label>
                    <textarea value={procForm.note} onChange={e => setProcForm(f => ({ ...f, note: e.target.value }))} rows="2" placeholder="หมายเหตุเพิ่มเติม"
                      className="w-full rounded-xl border border-purple-200 focus:border-purple-500 focus:ring focus:ring-purple-200 px-3 py-2 text-sm text-slate-700 resize-none" />
                  </div>
                </div>
                <StaffFields theme="purple" formData={procStaff} handleInputChange={e => setProcStaff(s => ({ ...s, [e.target.name]: e.target.value }))} />
                <div>
                  <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider border-b pb-1 mb-3">รูปภาพก่อน / หลังทำ</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <ImageUploadBlock type="before" existingImages={[]} setExistingImages={() => {}} newPreviews={procBeforePrev}
                      onRemoveNew={(_, idx) => { setProcBefore(p => p.filter((__, i) => i !== idx)); setProcBeforePrev(p => p.filter((__, i) => i !== idx)); }}
                      onClickAdd={() => procBeforeRef.current?.click()} onLightbox={(imgs, idx) => setLightbox({ images: imgs, index: idx })} />
                    <ImageUploadBlock type="after" existingImages={[]} setExistingImages={() => {}} newPreviews={procAfterPrev}
                      onRemoveNew={(_, idx) => { setProcAfter(p => p.filter((__, i) => i !== idx)); setProcAfterPrev(p => p.filter((__, i) => i !== idx)); }}
                      onClickAdd={() => procAfterRef.current?.click()} onLightbox={(imgs, idx) => setLightbox({ images: imgs, index: idx })} />
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-100 p-4 bg-gray-50 flex justify-end gap-3 shrink-0 rounded-b-3xl">
                <button type="button" onClick={() => { setAddProcPatient(null); resetProc(); }} className="px-5 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-200 transition-colors">ยกเลิก</button>
                <button onClick={handleProcSubmit} disabled={procSubmitting || !procForm.service || !procForm.serviceDate}
                  className={`px-6 py-2.5 rounded-xl text-white font-bold shadow-md transition-all flex items-center gap-2
                    ${procSubmitting || !procForm.service || !procForm.serviceDate ? 'bg-purple-300 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:shadow-lg active:scale-[0.98]'}`}>
                  {procSubmitting ? <><Sparkles className="animate-spin w-4 h-4" /> กำลังบันทึก...</> : <><Save className="w-4 h-4" /> บันทึกประวัติ</>}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Edit Patient Info Modal */}
      {editPatientHN && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-700 to-purple-500 px-5 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/20 rounded-xl"><FileEdit className="w-4 h-4" /></div>
                <h3 className="font-bold text-base">แก้ไขข้อมูลลูกค้า</h3>
              </div>
              <button onClick={() => setEditPatientHN(null)} className="p-1.5 hover:bg-white/20 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">ชื่อ-นามสกุล <span className="text-red-500">*</span></label>
                <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-4 w-4 text-purple-400" /></div>
                  <input autoFocus type="text" value={editPatientForm.fullName}
                    onChange={e => setEditPatientForm(f => ({ ...f, fullName: e.target.value }))}
                    className="pl-10 w-full rounded-xl border border-purple-200 focus:border-purple-500 focus:ring focus:ring-purple-200 px-3 py-2.5 text-sm text-slate-700" /></div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">เบอร์โทรศัพท์</label>
                <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Phone className="h-4 w-4 text-purple-400" /></div>
                  <input type="tel" value={editPatientForm.phone}
                    onChange={e => setEditPatientForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="08X-XXX-XXXX"
                    className="pl-10 w-full rounded-xl border border-purple-200 focus:border-purple-500 focus:ring focus:ring-purple-200 px-3 py-2.5 text-sm text-slate-700" /></div>
              </div>
              <p className="text-[11px] text-slate-400">การแก้ไขจะอัปเดตทุก record ของ HN นี้</p>
            </div>
            <div className="px-5 pb-5 flex gap-3">
              <button onClick={() => setEditPatientHN(null)} className="flex-1 py-2.5 rounded-xl text-slate-600 font-bold bg-slate-100 hover:bg-slate-200 transition-colors text-sm">ยกเลิก</button>
              <button onClick={saveEditPatient} disabled={editPatientSaving || !editPatientForm.fullName}
                className={`flex-1 py-2.5 rounded-xl text-white font-bold transition-all text-sm flex items-center justify-center gap-2 shadow-md
                  ${editPatientSaving || !editPatientForm.fullName ? 'bg-purple-300 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 active:scale-[0.98]'}`}>
                {editPatientSaving ? <><Sparkles className="animate-spin w-4 h-4" /> กำลังบันทึก...</> : <><Save className="w-4 h-4" /> บันทึก</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {recordToDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 className="w-8 h-8" /></div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">ยืนยันการลบข้อมูล</h3>
            <p className="text-slate-500 text-sm mb-6">คุณแน่ใจหรือไม่ว่าต้องการลบประวัตินี้?</p>
            <div className="flex gap-3">
              <button onClick={() => setRecordToDelete(null)} className="flex-1 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">ยกเลิก</button>
              <button onClick={() => confirmDelete(recordToDelete)} className="flex-1 py-2.5 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-md">ลบข้อมูล</button>
            </div>
          </div>
        </div>
      )}

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

      {lightbox && (() => {
        const { images, index } = lightbox;
        const total = images.length;
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
            {total > 1 && <button onClick={e => { e.stopPropagation(); setLightbox(lb => ({ ...lb, index: (lb.index - 1 + total) % total })); }} className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white rounded-full p-2.5 z-10 backdrop-blur-sm"><ChevronLeft className="w-6 h-6" /></button>}
            <img key={index} src={images[index]} alt="" className="max-w-[85vw] max-h-[85vh] object-contain rounded-lg shadow-2xl select-none" style={{ animation: 'fadeIn 0.18s ease' }} onClick={e => e.stopPropagation()} draggable={false} />
            {total > 1 && <button onClick={e => { e.stopPropagation(); setLightbox(lb => ({ ...lb, index: (lb.index + 1) % total })); }} className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white rounded-full p-2.5 z-10 backdrop-blur-sm"><ChevronRight className="w-6 h-6" /></button>}
            <style>{`@keyframes fadeIn { from { opacity: 0.4; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }`}</style>
          </div>
        );
      })()}
    </div>
  );
};

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [records, setRecords] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(true);
  const [dbStatus, setDbStatus] = useState('กำลังเชื่อมต่อ...');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [alertMessage, setAlertMessage] = useState('');
  const [pendingBooking, setPendingBooking] = useState(null);

  useEffect(() => {
    if (!auth) { setLoading(false); return; }
    const initAuth = async () => {
      try { await signInAnonymously(auth); }
      catch (error) { setDbStatus('เชื่อมต่อ Auth ไม่สำเร็จ'); setIsOffline(true); setLoading(false); }
    };
    initAuth();
    const unsub = onAuthStateChanged(auth, u => { if (u) setUser(u); });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    let loaded = { records: false, bookings: false };
    const checkDone = () => { if (loaded.records && loaded.bookings) setLoading(false); };

    const unsubRecords = onSnapshot(RECORDS_PATH(), snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => new Date(b.serviceDate) - new Date(a.serviceDate) || (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setRecords(data);
      setIsOffline(false);
      setDbStatus('เชื่อมต่อฐานข้อมูลสำเร็จ ✓');
      loaded.records = true;
      checkDone();
    }, err => {
      setIsOffline(true);
      setDbStatus(err.code === 'permission-denied' ? 'ติดสิทธิ์การเข้าถึง' : 'ทำงานแบบออฟไลน์');
      loaded.records = true;
      checkDone();
    });

    const unsubBookings = onSnapshot(BOOKINGS_PATH(), snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.bookingDate + b.bookingTime).localeCompare(a.bookingDate + a.bookingTime));
      setBookings(data);
      loaded.bookings = true;
      checkDone();
    }, err => {
      console.error("Bookings error:", err);
      loaded.bookings = true;
      checkDone();
    });

    return () => { unsubRecords(); unsubBookings(); };
  }, [user]);

  const patientMap = new Map();
  records.forEach(r => {
    if (!patientMap.has(r.hn)) {
      patientMap.set(r.hn, { hn: r.hn, fullName: r.fullName, phone: r.phone || '', membershipTier: r.membershipTier || DEFAULT_TIER });
    } else {
      const p = patientMap.get(r.hn);
      if (r.membershipTier && MEMBERSHIP_TIERS[r.membershipTier]) p.membershipTier = r.membershipTier;
    }
  });
  const patients = Array.from(patientMap.values());

  const handleAddBookingForPatient = (patient) => {
    setPendingBooking({ ...EMPTY_BOOKING(), hn: patient.hn, customerName: patient.fullName, phoneNumber: patient.phone || '' });
    setActiveTab('dashboard');
  };

  const TABS = [
    { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    { id: 'summary',   label: 'สรุปผลการจอง', Icon: BarChart3 },
    { id: 'patients',  label: 'ประวัติลูกค้า', Icon: BookOpen },
  ];

  if (loading) return (
    <div className="min-h-screen bg-purple-50 flex items-center justify-center">
      <div className="text-purple-600 flex flex-col items-center">
        <Sparkles className="w-10 h-10 mb-4 text-purple-500 animate-spin" />
        <p className="text-lg font-medium">กำลังโหลดระบบ Florenza Clinic...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F3FF] text-slate-800 font-sans pb-16">
      {isOffline && (
        <div className="bg-red-500 text-white text-sm font-bold px-4 py-2 text-center">
          ⚠️ ข้อมูลไม่ได้ถูกจัดเก็บในฐานข้อมูลจริง (Offline Mode)
        </div>
      )}

      <header className="bg-gradient-to-r from-purple-900 via-purple-800 to-blue-800 text-white shadow-lg sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white p-2 rounded-full shadow-md"><Database className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" /></div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold tracking-tight">Florenza Clinic</h1>
                <p className="text-purple-200 text-[10px] sm:text-sm font-medium">ระบบจัดการประวัติ · นัดหมาย · ติดตาม</p>
              </div>
            </div>
            <div className={`hidden md:flex items-center px-3 py-1.5 rounded-full text-xs font-bold border ${isOffline ? 'bg-red-500/20 text-red-100 border-red-400/30' : 'bg-green-500/20 text-green-100 border-green-400/30'}`}>
              {isOffline ? <WifiOff className="w-3.5 h-3.5 mr-1.5" /> : <Wifi className="w-3.5 h-3.5 mr-1.5" />}
              {dbStatus}
            </div>
          </div>
        </div>
        <div className="bg-black/20 border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto">
            {TABS.map(({ id, label, Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`py-3 px-4 sm:px-6 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${activeTab === id ? 'border-white text-white bg-white/10' : 'border-transparent text-purple-200 hover:text-white hover:bg-white/10'}`}>
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'dashboard' && (
          <DashboardTab bookings={bookings} patients={patients} isOffline={isOffline} records={records}
            initialBooking={pendingBooking} onPendingBookingConsumed={() => setPendingBooking(null)} />
        )}
        {activeTab === 'summary' && <SummaryTab bookings={bookings} />}
        {activeTab === 'patients' && (
          <PatientsTab records={records} user={user} isOffline={isOffline}
            onAddBookingForPatient={handleAddBookingForPatient} />
        )}
      </main>

      {alertMessage && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-16 h-16 bg-purple-100 text-purple-500 rounded-full flex items-center justify-center mx-auto mb-4"><Sparkles className="w-8 h-8" /></div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">แจ้งเตือน</h3>
            <p className="text-slate-600 text-sm mb-6 whitespace-pre-line">{alertMessage}</p>
            <button onClick={() => setAlertMessage('')} className="w-full py-2.5 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors">ตกลง</button>
          </div>
        </div>
      )}
    </div>
  );
}
