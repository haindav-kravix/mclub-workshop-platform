import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiCamera, FiCheckCircle, FiDownload, FiLogIn, FiRefreshCw, FiSearch, FiShield, FiUsers, FiXCircle } from 'react-icons/fi';
import jsQR from 'jsqr';
import { entryAPI } from '../utils/api';
import { ErrorMessage, FeedbackPopup, LoadingSpinner } from '../components/UI';

export const AdminEntryPage = () => {
  const { workshopId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scannerTimerRef = useRef(null);
  const streamRef = useRef(null);
  const scanLoadingRef = useRef(false);
  const activeScanValueRef = useRef('');
  const blankFrameCountRef = useRef(0);
  const lastDecodeAtRef = useRef(0);
  const lastSubmittedAtRef = useRef(new Map());
  const scanNoticeTimerRef = useRef(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState('');
  const [scanLoading, setScanLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [sessionScanCount, setSessionScanCount] = useState(0);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [scanNotice, setScanNotice] = useState(null);

  const loadReport = async () => {
    try {
      const response = await entryAPI.getReport(workshopId);
      setReport(response.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load entry management');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
    return () => {
      stopCamera();
      if (scanNoticeTimerRef.current) window.clearTimeout(scanNoticeTimerRef.current);
    };
  }, [workshopId]);

  useEffect(() => {
    scanLoadingRef.current = scanLoading;
  }, [scanLoading]);

  const stopCamera = () => {
    if (scannerTimerRef.current) window.cancelAnimationFrame(scannerTimerRef.current);
    scannerTimerRef.current = null;
    streamRef.current?.getTracks?.().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  };

  const showScanNotice = (message) => {
    if (scanNoticeTimerRef.current) window.clearTimeout(scanNoticeTimerRef.current);
    setScanNotice(message);
    scanNoticeTimerRef.current = window.setTimeout(() => {
      setScanNotice(null);
      scanNoticeTimerRef.current = null;
    }, 1000);
  };

  const handleScan = async (value = token) => {
    const passValue = String(value || '').trim();
    if (!passValue) {
      setError('Paste or scan an entry pass first');
      return;
    }

    scanLoadingRef.current = true;
    setScanLoading(true);
    setError('');
    try {
      const response = await entryAPI.scan(workshopId, passValue);
      setToken('');
      const studentName = response.data.entry?.user?.name || 'Student';
      if (response.data.alreadyEntered) {
        setFeedback({
          type: 'error',
          title: 'Already entered',
          message: `${studentName} has already entered at ${new Date(response.data.entry?.checkedInAt).toLocaleString()}.`
        });
      } else {
        setFeedback(null);
        showScanNotice(`${studentName} entry success`);
      }
      setSessionScanCount(count => count + 1);
      loadReport();
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to verify pass';
      setError(message);
      setFeedback({ type: 'error', title: 'Invalid pass', message });
    } finally {
      scanLoadingRef.current = false;
      setScanLoading(false);
    }
  };

  const scanCameraFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !streamRef.current) return;

    const now = Date.now();
    if (now - lastDecodeAtRef.current < 90) {
      scannerTimerRef.current = window.requestAnimationFrame(scanCameraFrame);
      return;
    }
    lastDecodeAtRef.current = now;

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth && video.videoHeight && !scanLoadingRef.current) {
      const context = canvas.getContext('2d', { willReadFrequently: true });
      const maxScanWidth = 640;
      const scale = Math.min(1, maxScanWidth / video.videoWidth);
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const qrCode = jsQR(imageData.data, canvas.width, canvas.height, {
        inversionAttempts: 'attemptBoth'
      });

      const scannedValue = String(qrCode?.data || '').trim();
      if (scannedValue) {
        blankFrameCountRef.current = 0;
        const lastSubmittedAt = lastSubmittedAtRef.current.get(scannedValue) || 0;
        const isFreshValue = scannedValue !== activeScanValueRef.current;
        const canRepeatSameQr = now - lastSubmittedAt > 1800;

        if (isFreshValue || canRepeatSameQr) {
          activeScanValueRef.current = scannedValue;
          lastSubmittedAtRef.current.set(scannedValue, now);
          handleScan(scannedValue);
        }
      } else {
        blankFrameCountRef.current += 1;
        if (blankFrameCountRef.current >= 4) {
          activeScanValueRef.current = '';
        }
      }
    }

    scannerTimerRef.current = window.requestAnimationFrame(scanCameraFrame);
  };

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera access is not supported in this browser. Please open this page in Chrome or Safari and allow camera permission.');
      return;
    }

    try {
      stopCamera();
      activeScanValueRef.current = '';
      blankFrameCountRef.current = 0;
      lastDecodeAtRef.current = 0;
      lastSubmittedAtRef.current = new Map();
      setSessionScanCount(0);
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      videoRef.current.setAttribute('playsinline', 'true');
      videoRef.current.setAttribute('webkit-playsinline', 'true');
      await videoRef.current.play();
      setCameraActive(true);
      scannerTimerRef.current = window.requestAnimationFrame(scanCameraFrame);
    } catch {
      setError('Unable to open camera. Please allow camera access or paste the pass text.');
    }
  };

  const handleExport = async () => {
    try {
      const response = await entryAPI.exportReport(workshopId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${report?.workshop?.title || 'event'}-entry-report.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Unable to export entry report');
    }
  };

  const entered = useMemo(() => [...(report?.entered || [])].sort((a, b) => (
    new Date(b.entry?.checkedInAt || 0) - new Date(a.entry?.checkedInAt || 0)
  )), [report?.entered]);
  const notEntered = report?.notEntered || [];
  const counts = report?.counts || {};
  const recentEntry = useMemo(() => entered[0], [entered]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="entry-admin-page min-h-screen px-4 py-8 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <button onClick={() => navigate('/admin')} className="entry-back-button"><FiArrowLeft /> Admin Dashboard</button>

        <section className="entry-admin-hero mt-6">
          <div>
            <div className="entry-pass-kicker"><FiLogIn /> Entry Management</div>
            <h1>{report?.workshop?.title || 'Entry Management'}</h1>
            <p>Scan confirmed student entry passes at the gate. This records entry time only and does not affect attendance.</p>
          </div>
          <div className="entry-live-card">
            <span>Entry percentage</span>
            <strong>{counts.entryPercentage || 0}%</strong>
            <i style={{ width: `${counts.entryPercentage || 0}%` }} />
          </div>
        </section>

        {error && <div className="mt-5"><ErrorMessage message={error} onDismiss={() => setError('')} /></div>}

        <section className="entry-stat-grid mt-6">
          <div><FiUsers /><span>Confirmed</span><strong>{counts.confirmed || 0}</strong></div>
          <div><FiCheckCircle /><span>Entered</span><strong>{counts.entered || 0}</strong></div>
          <div><FiXCircle /><span>Not Entered</span><strong>{counts.notEntered || 0}</strong></div>
        </section>

        <section className="entry-admin-grid mt-6">
          <div className="entry-scanner-card">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Gate scanner</p>
                <h2>Verify entry pass</h2>
              </div>
              <FiShield className="text-emerald-600" size={26} />
            </div>
            <video ref={videoRef} className={`entry-camera ${cameraActive ? 'active' : ''}`} muted playsInline />
            <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
            {cameraActive && (
              <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-700">
                Scanner is open in the web page and will keep scanning new passes automatically. Session scans: {sessionScanCount}
              </p>
            )}
            {scanNotice && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-600 px-3 py-2 text-sm font-black text-white shadow-lg">
                <FiCheckCircle /> {scanNotice}
              </div>
            )}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button onClick={cameraActive ? stopCamera : startCamera} disabled={!cameraActive && scanLoading} className="entry-action-button secondary">
                <FiCamera /> {cameraActive ? 'Close Scanner' : 'Scan QR'}
              </button>
              <button onClick={loadReport} className="entry-action-button subtle"><FiRefreshCw /> Refresh</button>
            </div>
            <div className="entry-manual-box">
              <label>Paste scanned pass text</label>
              <textarea value={token} onChange={event => setToken(event.target.value)} rows="4" placeholder="Paste QR result or entryToken URL here" />
              <button onClick={() => handleScan()} disabled={scanLoading} className="entry-action-button">
                <FiSearch /> {scanLoading ? 'Verifying...' : 'Verify Pass'}
              </button>
            </div>
          </div>

          <div className="entry-recent-card">
            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Latest entry</p>
            {recentEntry ? (
              <>
                <h2>{recentEntry.user?.name}</h2>
                <p>{recentEntry.user?.email}</p>
                <strong>{new Date(recentEntry.entry.checkedInAt).toLocaleString()}</strong>
              </>
            ) : (
              <div className="entry-empty-mini">No one has entered yet.</div>
            )}
            <button onClick={handleExport} className="entry-action-button mt-5"><FiDownload /> Export Entry Report</button>
          </div>
        </section>

        <section className="entry-report-grid mt-6">
          <EntryList title="Entered Students" items={entered} entered />
          <EntryList title="Not Entered Yet" items={notEntered} />
        </section>
      </div>
      <FeedbackPopup open={Boolean(feedback)} type={feedback?.type} title={feedback?.title} message={feedback?.message} onClose={() => setFeedback(null)} />
    </div>
  );
};

const EntryList = ({ title, items, entered = false }) => (
  <div className="entry-list-card">
    <h2>{title}</h2>
    <div className="entry-list">
      {items.length === 0 ? (
        <div className="entry-empty-mini">No students in this list.</div>
      ) : items.map(item => (
        <div key={item._id} className="entry-row">
          <div>
            <strong>{item.user?.name}</strong>
            <span>{item.user?.email}</span>
          </div>
          {entered ? (
            <p>{new Date(item.entry.checkedInAt).toLocaleString()}</p>
          ) : (
            <p>Waiting</p>
          )}
        </div>
      ))}
    </div>
  </div>
);
