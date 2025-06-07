import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from '../apis/axios';

const MainPage = () => {
    const [participant, setParticipant] = useState('');
    const [participants, setParticipants] = useState<string[]>([]);
    const [settleType, setSettleType] = useState<'even' | 'item'>('even');
    const [previewFiles, setPreviewFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const [uploading, setUploading] = useState(false);

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

    const handleAddBtnClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            // 새로 선택한 파일들을 기존 대기열에 추가
            setPreviewFiles(prev => [...prev, ...files]);
            // 미리보기 URL 생성 및 추가
            const newUrls = files.map(file => URL.createObjectURL(file));
            setPreviewUrls(prev => [...prev, ...newUrls]);
        }
    };

    const handleRemovePreview = (idx: number) => {
        setPreviewFiles(prev => prev.filter((_, i) => i !== idx));
        setPreviewUrls(prev => prev.filter((_, i) => i !== idx));
    };

    const handlePayCheck = async () => {
        if (previewFiles.length === 0) {
            alert('영수증 이미지를 첨부해주세요.');
            return;
        }
        if (participants.length === 0) {
             alert('참여자를 추가해주세요.');
             return;
        }
        setUploading(true);
        try {
            const formData = new FormData();
            previewFiles.forEach(file => formData.append('image', file));

            // 이미지 업로드 POST 요청
            await axiosInstance.post('api/receipt/upload/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            // 참여자 명단 개별 POST 요청
            // 참여자 명단 배열을 순회하며 각 이름에 대해 개별 POST 요청 전송
            for (const participantName of participants) {
                // 각 참여자 이름을 JSON 객체 형태로 감싸서 전송
                const participantBody = {
                     name: participantName
                };

                // '/api/participant/' 엔드포인트로 JSON 형태의 본문 전송
                await axiosInstance.post('api/participant/join/', participantBody, {
                     headers: {
                         'Content-Type': 'application/json',
                     }
                });
              }

            // 업로드 성공 시 페이지 이동
             navigate('/check', { state: { settleType } });
        } catch (error: any) { // 에러 타입 명시
            console.error('업로드 및 참여자 명단 전송 실패:', error);
            alert('업로드 및 참여자 명단 전송에 실패했습니다.\n' + (error.response?.data?.detail || error.message)); // 상세 에러 메시지 포함
        } finally {
            setUploading(false);
        }
    };
    
    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-24 w-full">
            <section className="w-full max-w-2xl flex flex-col items-center pt-12">
                <h2 className="text-[40px] font-bold font-['Inter'] text-[#525761] mb-6 cursor-default">영수증 이미지 첨부</h2>
                <div className="flex items-center gap-4">
                    <button
                        className="w-[50px] h-[50px] flex items-center justify-center duration-200 cursor-pointer"
                        onClick={handleAddBtnClick}
                    >
                        <img src="/add.svg" alt="이미지 추가" className="w-10 h-10 hover:brightness-80" />
                    </button>
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                    />
                    <span className="text-[20px] font-bold font-['Inter'] text-[#525761]">이미지를 첨부하세요</span>
                </div>
                {/* 미리보기 썸네일 */}
                <div className="flex gap-2 mt-2">
                        {previewUrls.map((url, idx) => (
                            <div key={url} className="relative flex flex-col items-center">
                                <img
                                    src={url}
                                    alt={`미리보기 ${idx + 1}`}
                                    className="w-16 h-16 object-cover rounded border border-gray-300"
                                />
                                <button
                                    className="bottom-0 w-6 h-6 flex items-center justify-center text-s font-bold text-[#525761] z-10 cursor-pointer"
                                    onClick={() => handleRemovePreview(idx)}
                                    type="button"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                </div>
            </section>
            <section className="w-full max-w-2xl flex flex-col items-center">
                <h2 className="text-[40px] font-bold font-['Inter'] text-[#525761] mb-6 cursor-default">참여자 리스트</h2>
                <div className="flex items-center gap-4 mb-4">
                    <input
                        type="text"
                        value={participant}
                        onChange={e => setParticipant(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="참여자 이름 입력"
                        className="w-[220px] h-[50px] rounded-[12px] bg-[#F5F5F5] px-4 text-[18px] font-['Inter'] outline-none min-w-0"
                    />
                    <button
                        className="w-[70px] h-[50px] rounded-[12px] duration-200 bg-[#389EFF] hover:bg-[#0069CD] cursor-pointer"
                        onClick={handleAdd}
                        type="button"
                    >
                        <span className="text-[18px] font-bold font-['Inter'] text-white">추가</span>
                    </button>
                </div>
                <div className="w-[300px] h-[119px] rounded-[12px] flex flex-wrap items-start p-3 gap-2 overflow-y-auto bg-[#F5F5F5]">
                    {participants.map(name => (
                        <div
                            key={name}
                            className="h-[33px] rounded-[15px] flex items-center px-3 mr-2 mb-2 bg-[#389EFF]/30 border-2 border-[#389EFF]"
                        >
                            <span className="text-[18px] font-medium font-['Inter'] truncate text-[#0069CD]">{name}</span>
                            <button
                                className="ml-2 text-lg font-bold focus:outline-none flex items-center justify-center h-full text-[#0069CD] cursor-pointer"
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
                <h2 className="text-[40px] font-bold font-['Inter'] text-[#525761] mb-6 cursor-default">정산 방식 선택</h2>
                <div className="flex gap-6">
                    <button
                        className={`w-[170px] h-[59px] rounded-[12px] flex items-center justify-center duration-200 cursor-pointer ${settleType === 'even' ? 'bg-[#389EFF] hover:bg-[#0069CD]' : 'bg-[#A1A1A1] hover:bg-[#7A7A7A]'}`}
                        onClick={() => setSettleType('even')}
                        type="button"
                    >
                        <span className="text-white text-[24px] font-bold font-['Inter']">1/N 정산</span>
                    </button>
                    <button
                        className={`w-[170px] h-[59px] rounded-[12px] flex items-center justify-center duration-200 cursor-pointer ${settleType === 'item' ? 'bg-[#389EFF] hover:bg-[#0069CD]' : 'bg-[#A1A1A1] hover:bg-[#7A7A7A]'}`}
                        onClick={() => setSettleType('item')}
                        type="button"
                    >
                        <span className="text-white text-[24px] font-bold font-['Inter']">항목별 정산</span>
                    </button>
                </div>
            </section>
            {/* 하단 PayCheck 버튼 */}
            <div className="flex flex-col items-center mt-24 mb-24 w-full">
                <button
                    className={`
                        w-[310px] h-[72px] rounded-[16px] flex items-center justify-center
                        transition-colors duration-200 text-white font-bold text-[36px] font-['Inter']
                        ${uploading || previewFiles.length === 0 || participants.length === 0
                          ? 'bg-[#A1A1A1] cursor-not-allowed' // 비활성화 상태일 때 적용될 클래스
                          : 'bg-[#0083FF] hover:bg-[#0069CD] cursor-pointer' // 활성화 상태일 때 적용될 클래스
                        }
                    `}
                    onClick={handlePayCheck}
                    disabled={uploading || previewFiles.length === 0 || participants.length === 0}
                >
                PayCheck
                </button>
            </div>
        </div>
    );
};

export default MainPage;