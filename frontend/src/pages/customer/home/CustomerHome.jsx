import './CustomerHome.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import {
    CheckCircle2,
    ClipboardList,
    Wrench,
    Search,
    Car,
    MessageSquare,
    CreditCard,
    Calendar,
    Folders
} from 'lucide-react';

const CustomerHome = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const res = await api.get('/bookings');
                setBookings(res.data);
            } catch (error) {
                console.error('Error fetching bookings:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, []);

    const activeJob = bookings.find(b => b.status === 'In Progress');
    const upcomingJob = bookings.find(b => b.status === 'Pending');
    const recentServices = bookings.filter(b => b.status === 'Completed').slice(0, 3);
    const progressWidthClassMap = {
        0: 'w-0',
        5: 'w-[5%]',
        10: 'w-[10%]',
        15: 'w-[15%]',
        20: 'w-[20%]',
        25: 'w-[25%]',
        30: 'w-[30%]',
        35: 'w-[35%]',
        40: 'w-[40%]',
        45: 'w-[45%]',
        50: 'w-1/2',
        55: 'w-[55%]',
        60: 'w-3/5',
        65: 'w-[65%]',
        70: 'w-[70%]',
        75: 'w-3/4',
        80: 'w-4/5',
        85: 'w-[85%]',
        90: 'w-[90%]',
        95: 'w-[95%]',
        100: 'w-full'
    };
    const roundedProgress = Math.max(0, Math.min(100, Math.round((activeJob?.progress || 0) / 5) * 5));
    const progressWidthClass = progressWidthClassMap[roundedProgress] || 'w-0';

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="w-10 h-10 border-4 border-[#F06A00] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="customer-home-theme absolute inset-0 overflow-y-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="customer-home-theme__inner max-w-[800px] mx-auto px-6 pt-10 pb-20">
                <div className="mb-10 pl-[10px]">
                    <h2 className="text-3xl font-black text-gray-900 mb-2">Welcome back!</h2>
                    <p className="text-gray-400 text-sm font-thin">Here is what is happening with your car today.</p>
                </div>

                {/* Active repair card */}
                {activeJob ? (
                    <div className="bg-[#18160F] rounded-[24px] overflow-hidden relative mb-5">
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgba(232,71,10,0.25)_0%,transparent_60%)] pointer-events-none"></div>
                        <div className="px-7 pt-7 pb-6 relative z-10">
                            <div className="text-[11px] font-bold text-white/35 uppercase tracking-[2px] mb-2.5">Currently in service</div>
                            <div className="text-[26px] font-extrabold text-white tracking-[-0.5px] mb-1">{activeJob.vehicle?.make} {activeJob.vehicle?.model}</div>
                            <div className="text-[14px] text-white/45 mb-[22px]">{activeJob.service}</div>
                            <div className="max-w-[480px]">
                                <div className="flex justify-between text-[12px] mb-2">
                                    <span className="text-white/50">Progress</span>
                                    <span className="text-white/85 font-bold font-mono">{activeJob.progress || 0}% complete</span>
                                </div>
                                <div className="h-1.5 bg-white/10 rounded-full">
                                    <div
                                        className={`h-full bg-gradient-to-r from-[#E8470A] to-[#FF5C1A] rounded-full transition-all duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)] ${progressWidthClass}`}
                                    ></div>
                                </div>
                            </div>
                        </div>
                        <div className="border-t border-white/10 flex items-center px-7 py-4 gap-6 relative z-10">
                            <div className="flex flex-col gap-1">
                                <div className="text-[15px] font-bold text-white font-mono">{new Date(activeJob.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                <div className="text-[11px] text-white/30">Started at</div>
                            </div>
                            <div className="w-px bg-white/10 h-7"></div>
                            <div className="flex flex-col gap-[3px]">
                                <div className="text-[15px] font-bold text-white font-mono">{activeJob.time}</div>
                                <div className="text-[11px] text-white/30">Est. pickup</div>
                            </div>
                            <div className="w-px bg-white/10 h-7"></div>
                            <div className="flex flex-col gap-[3px]">
                                <div className="text-[15px] font-bold text-white font-mono">{activeJob.mechanic?.name || 'Assigned'}</div>
                                <div className="text-[11px] text-white/30">Your mechanic</div>
                            </div>
                            <div className="ml-auto">
                                <button
                                    className="bg-[#E8470A] hover:bg-[#FF5C1A] hover:scale-[1.02] text-white border-none py-2.5 px-5 rounded-xl text-[13px] font-bold flex items-center gap-2 transition-all font-sans"
                                    onClick={() => navigate('/customer/tracking')}
                                >
                                    See live updates &rarr;
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="customer-home-theme__surface customer-home-theme__empty bg-white rounded-[24px] p-12 text-center border-2 border-dashed border-[#E4E1DA] mb-8 transition-colors hover:border-[#FFD5C0]">
                        <h4 className="text-xl font-bold text-[#18160F] mb-2">No cars in service right now.</h4>
                        <p className="text-[#756F65] text-sm mb-6">You can book a new service if you need one below!</p>
                        <button
                            onClick={() => navigate('/customer/book')}
                            className="bg-[#E8470A] hover:bg-[#FF5C1A] text-white px-8 py-3.5 rounded-xl text-sm font-bold shadow-md shadow-orange-500/20 transition-all hover:translate-y-[-2px]"
                        >
                            📅 Book a Service
                        </button>
                    </div>
                )}

                {/* Repair stage chips */}
                {activeJob && (
                    <>
                        <div className="text-[12px] font-bold uppercase tracking-[1.5px] text-[#B0A99E] mb-3.5 mt-6">Repair stages</div>
                        <div className="flex gap-2.5 mb-5 overflow-x-auto pb-1 scrollbar-hide">
                            {(() => {
                                const stages = ['Vehicle Checked In', 'Diagnostic', 'Parts Replacement', 'Quality Check', 'Ready for Pickup'];
                                const currentStage = activeJob.stage === 'Pending' ? 'Vehicle Checked In' : (activeJob.stage || 'Vehicle Checked In');
                                let currentIndex = stages.indexOf(currentStage);
                                if (currentIndex === -1) currentIndex = 0;

                                return (
                                    <>
                                        <StepChip icon={<CheckCircle2 size={18} />} label="Check-In" done={currentIndex > 0} active={currentStage === 'Vehicle Checked In'} />
                                        <StepChip icon={<ClipboardList size={18} />} label="Diagnosed" done={currentIndex > 1} active={currentStage === 'Diagnostic'} />
                                        <StepChip icon={<Wrench size={18} />} label="Repairing" done={currentIndex > 2} active={currentStage === 'Parts Replacement'} />
                                        <StepChip icon={<Search size={18} />} label="QA Check" done={currentIndex > 3} active={currentStage === 'Quality Check'} />
                                        <StepChip icon={<Car size={18} />} label="Ready!" done={false} active={currentStage === 'Ready for Pickup'} />
                                    </>
                                );
                            })()}
                        </div>
                    </>
                )}

                {/* Next appointment */}
                {upcomingJob && (
                    <>
                        <div className="text-[12px] font-bold uppercase tracking-[1.5px] text-[#B0A99E] mb-3.5 mt-8">Upcoming appointment</div>
                        <div className="customer-home-theme__surface customer-home-theme__upcoming flex items-center gap-4 bg-white rounded-[18px] border-[1.5px] border-[#E4E1DA] p-5 mb-5 hover:border-[#FFD5C0] hover:shadow-lg hover:shadow-black/[0.03] transition-all cursor-pointer group">
                            <div className="w-12 h-12 rounded-xl bg-[#FFF0EA] border-[1.5px] border-[#FFD5C0] flex items-center justify-center text-[22px] shrink-0">📅</div>
                            <div className="flex-1">
                                <div className="text-[15px] font-bold text-[#18160F] mb-0.5">{upcomingJob.service} — {upcomingJob.vehicle?.make} {upcomingJob.vehicle?.model}</div>
                                <div className="text-[12px] text-[#756F65]">{new Date(upcomingJob.createdAt).toLocaleDateString()} · {upcomingJob.time} · {upcomingJob.mechanic?.name}</div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    className="px-3.5 py-2 rounded-lg text-[12px] font-semibold bg-[#F2F0EB] border-[1.5px] border-[#E4E1DA] text-[#756F65] hover:border-[#E8470A] hover:text-[#E8470A] transition-all"
                                    onClick={() => navigate('/customer/book', { state: { rescheduleBooking: upcomingJob } })}
                                >
                                    Reschedule
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* Quick Actions */}
                <div className="text-[12px] font-bold uppercase tracking-[1.5px] text-[#B0A99E] mb-3.5 mt-8">Quick actions</div>
                <div className="grid grid-cols-4 gap-2.5 mb-5">
                    <QuickAction icon={<MessageSquare size={22} />} label="Message Mechanic" onClick={() => navigate('/customer/chat')} />
                    <QuickAction icon={<CreditCard size={22} />} label="Pay Invoice" onClick={() => navigate('/customer/payment')} />
                    <QuickAction icon={<Calendar size={22} />} label="Book Service" onClick={() => navigate('/customer/book')} />
                    <QuickAction icon={<Folders size={22} />} label="View History" onClick={() => navigate('/customer/history')} />
                </div>

                {/* Extra Student Section */}
                {/* <div className="mt-8 p-6 bg-orange-50 border border-orange-100 rounded-lg shadow-sm">
                    <h5 className="text-[14px] font-black text-orange-800 mb-3">TIPS FOR CAR CARE</h5>
                    <ul className="text-[12px] text-orange-700 space-y-1 italic">
                        <li>- Check tire pressure every month.</li>
                        <li>- Oil changes are very important!</li>
                        <li>- Keep your car clean for better life.</li>
                    </ul>
                </div> */}

                {/* Recent services - Updated student style */}
                <div className="customer-home-theme__surface customer-home-theme__history bg-white rounded-none border-2 border-gray-100 p-8 shadow-sm mt-10">
                    <div className="text-[11px] font-black uppercase text-gray-300 mb-6 tracking-widest">Your Service History</div>
                    <div className="flex flex-col">
                        {recentServices.length === 0 ? (
                            <div className="py-10 text-center text-xs text-gray-400">Nothing here yet!</div>
                        ) : (
                            recentServices.map(service => (
                                <ServiceRow
                                    key={service.id}
                                    icon={<Wrench size={18} />}
                                    name={service.service}
                                    sub={`${service.vehicle?.make} ${service.vehicle?.model} · ${new Date(service.createdAt).toLocaleDateString()}`}
                                    price={`Rs. ${service.amount || '0'}`}
                                />
                            ))
                        )}

                        <div className="text-center pt-6 mt-4 border-t border-gray-50">
                            <span
                                className="text-sm font-black text-[#FF5C1A] cursor-pointer hover:underline"
                                onClick={() => navigate('/customer/history')}
                            >
                                SHOW ALL HISTORY...
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Sub-components
const StepChip = ({ icon, label, done = false, active = false }) => (
    <div className={`shrink-0 flex flex-col items-center gap-2 rounded-2xl border-[1.5px] p-4 min-w-[100px] transition-all ${done ? 'bg-[#F0FDF4] border-[#BBF7D0]' :
        active ? 'bg-[#FFF0EA] border-[#FFD5C0] shadow-[0_0_0_3px_rgba(232,71,10,0.08)]' :
            'bg-white border-[#E4E1DA]'
        }`}>
        <div className={`text-[20px] ${done ? 'text-[#15803D]' : active ? 'text-[#E8470A]' : 'text-[#756F65]'}`}>{icon}</div>
        <div className={`text-[11px] font-bold text-center ${done ? 'text-[#15803D]' : active ? 'text-[#E8470A]' : 'text-[#756F65]'}`}>
            {label}
        </div>
    </div>
);

const QuickAction = ({ icon, label, onClick }) => (
    <div
        className="customer-home-theme__surface customer-home-theme__quick bg-white border-[1.5px] border-[#E4E1DA] rounded-[18px] p-4.5 py-4 text-center cursor-pointer transition-all hover:bg-[#FFF0EA] hover:border-[#FFD5C0] hover:-translate-y-0.5 group"
        onClick={onClick}
    >
        <div className="flex justify-center mb-2.5 text-[#756F65] group-hover:text-[#E8470A] transition-colors">{icon}</div>
        <div className="text-[12px] font-bold text-[#18160F]">{label}</div>
    </div>
);

const ServiceRow = ({ icon, name, sub, price }) => (
    <div className="customer-home-theme__service-row flex items-center gap-3.5 py-3.5 border-b border-[#E4E1DA] last:border-none">
        <div className="w-10 h-10 rounded-xl bg-[#F2F0EB] border-[1.5px] border-[#E4E1DA] flex items-center justify-center text-[18px] shrink-0">{icon}</div>
        <div className="flex-1">
            <div className="text-[13px] font-bold text-[#18160F]">{name}</div>
            <div className="text-[11px] text-[#B0A99E] mt-0.5">{sub}</div>
        </div>
        <div className="text-[14px] font-extrabold text-[#18160F] font-mono">{price}</div>
    </div>
);

export default CustomerHome;





