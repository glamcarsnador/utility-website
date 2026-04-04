import { useState, useEffect, useRef, useCallback, DragEvent } from 'react';
import { jsPDF } from 'jspdf';
import { 
  Calculator, 
  FileImage, 
  Trash2, 
  Download, 
  Plus, 
  X, 
  Loader2,
  UploadCloud,
  Sun,
  Moon,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Tab = 'calculator' | 'converter' | 'calendar';

interface ImageFile {
  id: string;
  file: File;
  preview: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('calculator');
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Calculator State
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcExpression, setCalcExpression] = useState('');
  
  // Converter State
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Calculator Logic ---
  const handleCalcInput = useCallback((val: string) => {
    setCalcDisplay(prev => {
      if (prev === '0' && !isNaN(Number(val))) return val;
      if (prev === 'Error') return val;
      return prev + val;
    });
  }, []);

  const handleCalcClear = () => {
    setCalcDisplay('0');
    setCalcExpression('');
  };

  const handleCalcDelete = () => {
    setCalcDisplay(prev => {
      if (prev.length <= 1 || prev === 'Error') return '0';
      return prev.slice(0, -1);
    });
  };

  const handleCalcEquals = () => {
    try {
      // Basic sanitization and evaluation
      const sanitized = calcDisplay.replace(/[^-+*/.0-9]/g, '');
      // eslint-disable-next-line no-eval
      const result = eval(sanitized);
      setCalcExpression(calcDisplay + ' =');
      setCalcDisplay(String(result));
    } catch (e) {
      setCalcDisplay('Error');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== 'calculator') return;
      
      if (/[0-9]/.test(e.key)) handleCalcInput(e.key);
      if (['+', '-', '*', '/'].includes(e.key)) handleCalcInput(e.key);
      if (e.key === 'Enter' || e.key === '=') handleCalcEquals();
      if (e.key === 'Backspace') handleCalcDelete();
      if (e.key === 'Escape') handleCalcClear();
      if (e.key === '.') handleCalcInput('.');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, handleCalcInput]);

  // --- Converter Logic ---
  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    
    const newImages: ImageFile[] = Array.from(files)
      .filter(file => file.type.startsWith('image/'))
      .map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file)
      }));
    
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      const removed = prev.find(img => img.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      return filtered;
    });
  };

  const generatePdf = async () => {
    if (images.length === 0) return;
    setIsConverting(true);
    
    try {
      const pdf = new jsPDF();
      
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const imgData = await getImageData(img.preview);
        
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        
        const imgProps = pdf.getImageProperties(imgData);
        const ratio = imgProps.width / imgProps.height;
        let width = pageWidth;
        let height = pageWidth / ratio;
        
        if (height > pageHeight) {
          height = pageHeight;
          width = pageHeight * ratio;
        }

        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', (pageWidth - width) / 2, (pageHeight - height) / 2, width, height);
      }
      
      pdf.save('converted-images.pdf');
    } catch (error) {
      console.error('PDF Generation failed', error);
    } finally {
      setIsConverting(false);
    }
  };

  const getImageData = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const onDragLeave = () => {
    setDragActive(false);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans selection:bg-indigo-500/30 ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Background Accents */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-[10%] -left-[10%] w-[40%] h-[40%] blur-[120px] rounded-full transition-colors duration-700 ${
          isDarkMode ? 'bg-indigo-600/20' : 'bg-indigo-200/40'
        }`} />
        <div className={`absolute top-[60%] -right-[10%] w-[50%] h-[50%] blur-[120px] rounded-full transition-colors duration-700 ${
          isDarkMode ? 'bg-purple-600/10' : 'bg-purple-200/30'
        }`} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="text-center md:text-left">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400"
            >
              Utility Hub
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`mt-2 text-lg transition-colors ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
            >
              Professional tools for your daily workflow.
            </motion.p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-3 rounded-2xl border transition-all duration-300 flex items-center gap-2 ${
              isDarkMode 
                ? 'bg-slate-900 border-white/10 text-yellow-400 hover:bg-slate-800' 
                : 'bg-white border-slate-200 text-indigo-600 shadow-sm hover:bg-slate-50'
            }`}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            <span className="font-medium text-sm">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </motion.button>
        </header>

        {/* Navigation Tabs */}
        <nav className={`flex justify-center md:justify-start gap-2 p-1 backdrop-blur-xl border rounded-2xl mb-8 w-fit mx-auto md:mx-0 transition-all duration-300 ${
          isDarkMode 
            ? 'bg-slate-900/50 border-white/5' 
            : 'bg-white/80 border-slate-200 shadow-sm'
        }`}>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 ${
              activeTab === 'calculator' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                : isDarkMode 
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Calculator size={20} />
            <span className="font-medium">Calculator</span>
          </button>
          <button
            onClick={() => setActiveTab('converter')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 ${
              activeTab === 'converter' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                : isDarkMode 
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <FileImage size={20} />
            <span className="font-medium">PDF Converter</span>
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 ${
              activeTab === 'calendar' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                : isDarkMode 
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <CalendarIcon size={20} />
            <span className="font-medium">Calendar</span>
          </button>
        </nav>

        {/* Main Content Area */}
        <main className="min-h-[600px]">
          <AnimatePresence mode="wait">
            {activeTab === 'calculator' ? (
              <motion.div
                key="calculator"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex justify-center"
              >
                <div className={`w-full max-w-md backdrop-blur-2xl border rounded-3xl p-6 transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-slate-900/40 border-white/10 shadow-2xl' 
                    : 'bg-white/70 border-slate-200 shadow-xl shadow-slate-200/50'
                }`}>
                  {/* Display */}
                  <div className={`rounded-2xl p-6 mb-6 text-right overflow-hidden border transition-all duration-300 ${
                    isDarkMode 
                      ? 'bg-slate-950/50 border-white/5' 
                      : 'bg-slate-100/80 border-slate-200/50'
                  }`}>
                    <div className={`text-sm h-6 mb-1 font-mono truncate ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                      {calcExpression}
                    </div>
                    <div className={`text-4xl md:text-5xl font-bold font-mono tracking-tighter truncate ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                      {calcDisplay}
                    </div>
                  </div>

                  {/* Keypad */}
                  <div className="grid grid-cols-4 gap-3">
                    <CalcButton label="C" onClick={handleCalcClear} variant="danger" isDarkMode={isDarkMode} />
                    <CalcButton label="DEL" onClick={handleCalcDelete} variant="secondary" isDarkMode={isDarkMode} />
                    <CalcButton label="/" onClick={() => handleCalcInput('/')} variant="operator" isDarkMode={isDarkMode} />
                    <CalcButton label="*" onClick={() => handleCalcInput('*')} variant="operator" isDarkMode={isDarkMode} />
                    
                    <CalcButton label="7" onClick={() => handleCalcInput('7')} isDarkMode={isDarkMode} />
                    <CalcButton label="8" onClick={() => handleCalcInput('8')} isDarkMode={isDarkMode} />
                    <CalcButton label="9" onClick={() => handleCalcInput('9')} isDarkMode={isDarkMode} />
                    <CalcButton label="-" onClick={() => handleCalcInput('-')} variant="operator" isDarkMode={isDarkMode} />
                    
                    <CalcButton label="4" onClick={() => handleCalcInput('4')} isDarkMode={isDarkMode} />
                    <CalcButton label="5" onClick={() => handleCalcInput('5')} isDarkMode={isDarkMode} />
                    <CalcButton label="6" onClick={() => handleCalcInput('6')} isDarkMode={isDarkMode} />
                    <CalcButton label="+" onClick={() => handleCalcInput('+')} variant="operator" isDarkMode={isDarkMode} />
                    
                    <CalcButton label="1" onClick={() => handleCalcInput('1')} isDarkMode={isDarkMode} />
                    <CalcButton label="2" onClick={() => handleCalcInput('2')} isDarkMode={isDarkMode} />
                    <CalcButton label="3" onClick={() => handleCalcInput('3')} isDarkMode={isDarkMode} />
                    <CalcButton label="=" onClick={handleCalcEquals} variant="primary" isDarkMode={isDarkMode} className="row-span-2" />
                    
                    <CalcButton label="0" onClick={() => handleCalcInput('0')} isDarkMode={isDarkMode} className="col-span-2" />
                    <CalcButton label="." onClick={() => handleCalcInput('.')} isDarkMode={isDarkMode} />
                  </div>
                </div>
              </motion.div>
            ) : activeTab === 'calendar' ? (
              <motion.div
                key="calendar"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full flex justify-center"
              >
                <CalendarView isDarkMode={isDarkMode} />
              </motion.div>
            ) : (
              <motion.div
                key="converter"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full"
              >
                <div className={`backdrop-blur-2xl border rounded-3xl p-6 md:p-8 transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-slate-900/40 border-white/10 shadow-2xl' 
                    : 'bg-white/70 border-slate-200 shadow-xl shadow-slate-200/50'
                }`}>
                  {/* Dropzone */}
                  <div 
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative group cursor-pointer border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                      dragActive 
                        ? isDarkMode ? 'border-indigo-500 bg-indigo-500/10' : 'border-indigo-500 bg-indigo-50' 
                        : isDarkMode ? 'border-slate-700 hover:border-slate-500 hover:bg-white/5' : 'border-slate-200 hover:border-indigo-400 hover:bg-white/50'
                    }`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={(e) => handleFiles(e.target.files)}
                      multiple 
                      accept="image/png, image/jpeg" 
                      className="hidden" 
                    />
                    <div className="flex flex-col items-center gap-4">
                      <div className={`p-4 rounded-full transition-transform group-hover:scale-110 ${
                        isDarkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-500'
                      }`}>
                        <UploadCloud size={32} />
                      </div>
                      <div>
                        <p className={`text-xl font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>Drop images here</p>
                        <p className={isDarkMode ? 'text-slate-400 mt-1' : 'text-slate-500 mt-1'}>or click to browse from your device</p>
                      </div>
                      <p className={`text-xs uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Supports JPG, PNG</p>
                    </div>
                  </div>

                  {/* Preview Grid */}
                  {images.length > 0 && (
                    <div className="mt-8">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-lg font-medium flex items-center gap-2 ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                          Selected Images
                          <span className={`px-2 py-0.5 rounded-full text-xs ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                            {images.length}
                          </span>
                        </h3>
                        <button 
                          onClick={() => setImages([])}
                          className={`text-sm transition-colors ${isDarkMode ? 'text-slate-500 hover:text-red-400' : 'text-slate-400 hover:text-red-500'}`}
                        >
                          Clear All
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        <AnimatePresence>
                          {images.map((img) => (
                            <motion.div
                              key={img.id}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className={`relative group aspect-square rounded-xl overflow-hidden border transition-all ${
                                isDarkMode ? 'border-white/10 bg-slate-800' : 'border-slate-200 bg-slate-50'
                              }`}
                            >
                              <img 
                                src={img.preview} 
                                alt="Preview" 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm ${
                                isDarkMode ? 'bg-black/40' : 'bg-white/60'
                              }`}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeImage(img.id);
                                  }}
                                  className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>

                      {/* Action Button */}
                      <div className="mt-12 flex justify-center">
                        <button
                          onClick={generatePdf}
                          disabled={isConverting}
                          className={`group relative flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/20 transition-all active:scale-95 ${
                            isConverting ? 'opacity-80' : ''
                          } ${
                            isDarkMode && images.length === 0 ? 'disabled:bg-slate-800 disabled:text-slate-600' : 'disabled:bg-slate-200 disabled:text-slate-400'
                          }`}
                        >
                          {isConverting ? (
                            <>
                              <Loader2 className="animate-spin" size={20} />
                              Generating PDF...
                            </>
                          ) : (
                            <>
                              <Download size={20} className="group-hover:translate-y-0.5 transition-transform" />
                              Convert to PDF
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="mt-16 text-center text-slate-500 text-sm">
          <p>© 2026 Utility Hub. Built with React & Tailwind CSS.</p>
        </footer>
      </div>
    </div>
  );
}

interface CalcButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'operator' | 'secondary' | 'danger';
  className?: string;
  isDarkMode: boolean;
}

function CalcButton({ label, onClick, variant = 'default', className = '', isDarkMode }: CalcButtonProps) {
  const variants = {
    default: isDarkMode 
      ? 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-200 border border-white/5' 
      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/50',
    primary: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20',
    operator: isDarkMode
      ? 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20'
      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100',
    secondary: isDarkMode
      ? 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 border border-white/5'
      : 'bg-slate-200 hover:bg-slate-300 text-slate-600 border border-slate-300/50',
    danger: isDarkMode
      ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20'
      : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-100',
  };

  return (
    <button
      onClick={onClick}
      className={`
        h-14 md:h-16 rounded-2xl font-bold text-lg md:text-xl transition-all active:scale-95
        ${variants[variant]}
        ${className}
      `}
    >
      {label}
    </button>
  );
}

function CalendarView({ isDarkMode }: { isDarkMode: boolean }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const totalDays = daysInMonth(year, month);
  const startingDay = firstDayOfMonth(year, month);
  const today = new Date();

  const calendarDays = [];
  for (let i = 0; i < startingDay; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= totalDays; i++) {
    calendarDays.push(i);
  }

  return (
    <div className={`w-full max-w-2xl backdrop-blur-2xl border rounded-3xl p-6 md:p-8 transition-all duration-300 ${
      isDarkMode 
        ? 'bg-slate-900/40 border-white/10 shadow-2xl' 
        : 'bg-white/70 border-slate-200 shadow-xl shadow-slate-200/50'
    }`}>
      <div className="flex items-center justify-between mb-8">
        <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
          {monthNames[month]} {year}
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={prevMonth}
            className={`p-2 rounded-xl border transition-all ${
              isDarkMode ? 'bg-slate-800 border-white/5 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={nextMonth}
            className={`p-2 rounded-xl border transition-all ${
              isDarkMode ? 'bg-slate-800 border-white/5 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-4">
        {days.map(day => (
          <div key={day} className={`text-center text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((day, index) => {
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          return (
            <div 
              key={index} 
              className={`aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                day === null ? '' : 
                isToday 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105 z-10' 
                  : isDarkMode 
                    ? 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-white/5' 
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/50 shadow-sm'
              }`}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}
