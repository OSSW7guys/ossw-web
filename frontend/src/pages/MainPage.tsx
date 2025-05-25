import React, { useState } from 'react';

const MainPage = () => {
    const [participant, setParticipant] = useState('');
    const [participants, setParticipants] = useState<string[]>([]);
    const [settleType, setSettleType] = useState<'even' | 'item'>('even');
    const [addBtnHover, setAddBtnHover] = useState(false);
    const [evenBtnHover, setEvenBtnHover] = useState(false);
    const [itemBtnHover, setItemBtnHover] = useState(false);

    const handleAdd = () => {
        if (participant.trim() && !participants.includes(participant.trim())) {
            setParticipants([...participants, participant.trim()]);
            setParticipant('');
        }
    };

    const handleRemove = (name: string) => {
        setParticipants(participants.filter(p => p !== name));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleAdd();
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-24 w-full">
            <section className="w-full max-w-2xl flex flex-col items-center pt-12">
                <h2 className="text-[40px] font-bold font-['Inter'] text-[#525761] mb-6">영수증 이미지 첨부</h2>
                <div className="flex items-center gap-4">
                    <button
                        className="w-[50px] h-[50px] flex items-center justify-center duration-200"
                        onMouseOver={() => setAddBtnHover(true)}
                        onMouseOut={() => setAddBtnHover(false)}
                    >
                        <img src="/add.svg" alt="이미지 추가" className="w-10 h-10" style={{ filter: addBtnHover ? 'brightness(0.8)' : 'none' }} />
                    </button>
                    <span className="text-[20px] font-bold font-['Inter'] text-[#525761]">이미지를 첨부하세요</span>
                </div>
            </section>
            <section className="w-full max-w-2xl flex flex-col items-center">
                <h2 className="text-[40px] font-bold font-['Inter'] text-[#525761] mb-6">참여자 리스트</h2>
                <div className="flex items-center gap-4 mb-4">
                    <input
                        type="text"
                        value={participant}
                        onChange={e => setParticipant(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="참여자 이름 입력"
                        className="w-[220px] h-[50px] rounded-[12px] bg-[#F5F5F5] px-4 text-[18px] font-['Inter'] outline-none"
                        style={{ minWidth: 0 }}
                    />
                    <button
                        className="w-[70px] h-[50px] rounded-[12px] duration-200" style={{ background: '#389EFF' }}
                        onClick={handleAdd}
                        type="button"
                        onMouseOver={e => (e.currentTarget.style.backgroundColor = '#0069CD')}
                        onMouseOut={e => (e.currentTarget.style.backgroundColor = '#389EFF')}
                    >
                        <span className="text-[18px] font-bold font-['Inter']" style={{ color: '#FFFFFF' }}>추가</span>
                    </button>
                </div>
                <div className="w-[300px] h-[119px] rounded-[12px] flex flex-wrap items-start p-3 gap-2 overflow-y-auto" style={{ background: '#F5F5F5' }}>
                    {participants.map(name => (
                        <div
                            key={name}
                            className="w-[100px] h-[33px] rounded-[15px] flex items-center px-3 mr-2 mb-2"
                            style={{
                                backgroundColor: 'rgba(56, 158, 255, 0.3)',
                                border: '2px solid #389EFF',
                            }}
                        >
                            <span className="text-[18px] font-medium font-['Inter'] truncate" style={{ color: '#0069CD' }}>{name}</span>
                            <button
                                className="ml-2 text-lg font-bold focus:outline-none flex items-center justify-center h-full"
                                style={{ color: '#0069CD' }}
                                onClick={() => handleRemove(name)}
                                aria-label="참여자 삭제"
                                type="button"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            </section>
            <section className="w-full max-w-2xl flex flex-col items-center">
                <h2 className="text-[40px] font-bold font-['Inter'] text-[#525761] mb-6">정산 방식 선택</h2>
                <div className="flex gap-6">
                    <button
                        className="w-[170px] h-[59px] rounded-[12px] flex items-center justify-center duration-200"
                        style={{
                            background: settleType === 'even'
                                ? (evenBtnHover ? '#0069CD' : '#389EFF')
                                : (evenBtnHover ? '#7A7A7A' : '#A1A1A1'),
                        }}
                        onClick={() => setSettleType('even')}
                        type="button"
                        onMouseOver={() => setEvenBtnHover(true)}
                        onMouseOut={() => setEvenBtnHover(false)}
                    >
                        <span className="text-white text-[24px] font-bold font-['Inter']">1/N 정산</span>
                    </button>
                    <button
                        className="w-[170px] h-[59px] rounded-[12px] flex items-center justify-center duration-200"
                        style={{
                            background: settleType === 'item'
                                ? (itemBtnHover ? '#0069CD' : '#389EFF')
                                : (itemBtnHover ? '#7A7A7A' : '#A1A1A1'),
                        }}
                        onClick={() => setSettleType('item')}
                        type="button"
                        onMouseOver={() => setItemBtnHover(true)}
                        onMouseOut={() => setItemBtnHover(false)}
                    >
                        <span className="text-white text-[24px] font-bold font-['Inter']">항목별 정산</span>
                    </button>
                </div>
            </section>
            {/* 하단 PayCheck 버튼 */}
            <div className="flex flex-col items-center mt-24 mb-24 w-full">
                <button
                    className="w-[310px] h-[72px] rounded-[16px] bg-[#0083FF] flex items-center justify-center transition-colors duration-200"
                    style={{ color: '#fff', fontFamily: 'Inter', fontWeight: 700, fontSize: 36 }}
                    onMouseOver={e => (e.currentTarget.style.backgroundColor = '#0069CD')}
                    onMouseOut={e => (e.currentTarget.style.backgroundColor = '#0083FF')}
                >
                    PayCheck
                </button>
            </div>
        </div>
    );
};

export default MainPage;