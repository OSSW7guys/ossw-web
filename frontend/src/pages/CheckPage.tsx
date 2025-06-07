import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ReceiptDetail from '../components/ReceiptDetail';
import { axiosInstance } from '../apis/axios';
import type { Receipt } from '../types/receipt';

declare global {
    interface Window {
        Kakao: any;
    }
}

const CheckPage = () => {
    const [rawReceiptItems, setRawReceiptItems] = useState<Receipt[]>([]);
    const [groupedReceipts, setGroupedReceipts] = useState<Receipt[][]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalAmount, setTotalAmount] = useState<number>(0);
    const [allowedParticipants, setAllowedParticipants] = useState<string[]>([]);
    const [settlementResult, setSettlementResult] = useState<{[key: string]: number} | null>(null);
    // 항목별 정산을 위한 참여자 할당 데이터 (receiptId -> [{item_name, participants}, ...])
    const [receiptItemAssignments, setReceiptItemAssignments] = useState<Map<number, Array<{ item_name: string; participants: string[] }>>>(new Map());

    const [showAccountPopup, setShowAccountPopup] = useState(false);
    const [tempAccountHolder, setTempAccountHolder] = useState('');
    const [tempAccountNumber, setTempAccountNumber] = useState('');
    const [accountInfo, setAccountInfo] = useState({ holder: '', number: '' });
    const [kakaoReady, setKakaoReady] = useState(false);
    const [popupPosition, setPopupPosition] = useState<{ top: number; left: number } | null>(null);

    const kakaoShareButtonRef = useRef<HTMLButtonElement>(null);

    const navigate = useNavigate();
    const location = useLocation();
    const { settleType } = location.state as { settleType: 'even' | 'item' } || { settleType: 'even' }; // state에서 settleType 가져오기 (기본값 'even')

    useEffect(() => {
        const scriptId = 'kakao-sdk';
        if (!window.Kakao || !window.Kakao.isInitialized()) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = 'https://developers.kakao.com/sdk/js/kakao.js';
            script.onload = () => {
                if (window.Kakao) {
                    window.Kakao.init('c4913a27ee144670505405de9ee16631'); // 카카오 JavaScript 키
                    setKakaoReady(true);
                    console.log('Kakao SDK initialized (CheckPage):', window.Kakao.isInitialized());
                }
            };
            document.head.appendChild(script);
        } else {
            setKakaoReady(true);
        }
    }, []);

    // New useEffect to update popup position on scroll/resize
    useEffect(() => {
        const updatePopupPosition = () => {
            if (showAccountPopup && kakaoShareButtonRef.current) {
                const rect = kakaoShareButtonRef.current.getBoundingClientRect();
                setPopupPosition({
                    top: rect.top - 20, // 버튼 위로 여백을 20px 줌 (뷰포트 기준)
                    left: rect.left + rect.width / 2,
                });
            }
        };

        window.addEventListener('scroll', updatePopupPosition);
        window.addEventListener('resize', updatePopupPosition);

        // Clean up event listeners
        return () => {
            window.removeEventListener('scroll', updatePopupPosition);
            window.removeEventListener('resize', updatePopupPosition);
        };
    }, [showAccountPopup]); // Only re-run if popup visibility changes

    // 영수증 및 참여자 데이터 초기 로딩
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const receiptResponse = await axiosInstance.get<{ success: boolean; results: Receipt[] }>('api/receiptinfo/analyze/');
                const items = receiptResponse.data.results;
                setRawReceiptItems(items);

                const groupedData = groupReceiptItemsByReceiptId(items);
                setGroupedReceipts(groupedData);

                const calculatedTotal = items.reduce((sum, item) => sum + item.total_amount, 0);
                setTotalAmount(calculatedTotal);

                const participantResponse = await axiosInstance.get<{ success: boolean; message: string; data: { id: number; name: string }[] }>('api/participant/members/');
                if (participantResponse.data && Array.isArray(participantResponse.data.data)) {
                    const names = participantResponse.data.data.map(member => member.name);
                    setAllowedParticipants(names);
                } else {
                    console.error('참여자 명단 데이터 형식이 예상과 다릅니다.', participantResponse.data);
                    setAllowedParticipants([]);
                }

            } catch (err: any) {
                console.error('데이터 불러오기 실패:', err);
                setError('데이터를 불러오는데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []); // 초기 렌더링 시 한 번만 실행

    // ReceiptDetail에서 품목별 참여자 할당이 변경될 때 호출될 콜백 함수
    const handleItemParticipantsUpdate = (receiptId: number, itemIndex: number, updatedParticipants: string[]) => {
        setReceiptItemAssignments(prevAssignments => {
            const newAssignments = new Map(prevAssignments);
            const itemsForThisReceipt = groupedReceipts.find(group => group[0]?.receipt === receiptId);

            if (itemsForThisReceipt && itemsForThisReceipt[itemIndex]) {
                const currentItemName = itemsForThisReceipt[itemIndex].item_name;
                
                let currentReceiptAssignments = newAssignments.get(receiptId) || [];
                const existingItemAssignmentIndex = currentReceiptAssignments.findIndex(
                    assignment => assignment.item_name === currentItemName
                );

                if (existingItemAssignmentIndex > -1) {
                    // 기존 항목 업데이트
                    currentReceiptAssignments[existingItemAssignmentIndex] = {
                        item_name: currentItemName,
                        participants: updatedParticipants,
                    };
                } else {
                    // 새 항목 추가
                    currentReceiptAssignments.push({
                        item_name: currentItemName,
                        participants: updatedParticipants,
                    });
                }
                newAssignments.set(receiptId, currentReceiptAssignments);
            }
            return newAssignments;
        });
    };

    // 정산 API 호출 로직 (settleType, rawReceiptItems, allowedParticipants, receiptItemAssignments 변경 시 실행)
    useEffect(() => {
        const calculateSettlement = async () => {
            // 로딩 중이거나 에러가 있거나, 필수 데이터가 없으면 실행하지 않음
            if (loading || error || rawReceiptItems.length === 0 || allowedParticipants.length === 0) {
                return;
            }

            try {
                if (settleType === 'even') {
                    const uniqueReceiptIds = Array.from(new Set(rawReceiptItems.map(item => item.receipt)));
                    const receiptsForEqualMethod = uniqueReceiptIds.map(id => ({ receipt_id: id }));

                    const settlementResponse = await axiosInstance.post<{ success: boolean; message: string; result: { [key: string]: number } }>('/api/settlement/calculate/', {
                        method: "equal",
                        receipts: receiptsForEqualMethod,
                        participants: allowedParticipants,
                    });
                    if (settlementResponse.data.success) {
                        setSettlementResult(settlementResponse.data.result);
                    } else {
                        console.error('정산 계산 실패 (1/N):', settlementResponse.data.message);
                    }
                } else if (settleType === 'item') {
                    // 항목별 정산을 위한 API 요청 본문 구성
                    const receiptsForItemsMethod = Array.from(receiptItemAssignments.entries()).map(([receiptId, items]) => ({
                        receipt_id: receiptId,
                        items: items,
                    }));

                    if (receiptsForItemsMethod.length > 0) { // 할당된 품목이 있을 때만 API 호출
                        const settlementResponse = await axiosInstance.post<{ success: boolean; message: string; result: { [key: string]: number } }>('/api/settlement/calculate/', {
                            method: "item",
                            receipts: receiptsForItemsMethod,
                        });
                        if (settlementResponse.data.success) {
                            setSettlementResult(settlementResponse.data.result);
                        } else {
                            console.error('정산 계산 실패 (항목별):', settlementResponse.data.message);
                        }
                    } else {
                        // 할당된 품목이 없으면 정산 결과 초기화
                        setSettlementResult(null);
                    }
                }
            } catch (settlementError: any) {
                console.error('정산 계산 API 호출 실패:', settlementError);
            }
        };

        calculateSettlement();
    }, [settleType, rawReceiptItems, allowedParticipants, receiptItemAssignments, loading, error]); // 의존성 배열

    const groupReceiptItemsByReceiptId = (items: Receipt[]): Receipt[][] => {
        const receiptsMap = new Map<number, Receipt[]>();
        items.forEach(item => {
            if (!receiptsMap.has(item.receipt)) {
                receiptsMap.set(item.receipt, []);
            }
            receiptsMap.get(item.receipt)!.push(item);
        });
        return Array.from(receiptsMap.values());
    };

    const generateShareMessage = useCallback(() => {
        const accountInfoText = accountInfo.holder && accountInfo.number
            ? `💰${accountInfo.number} ${accountInfo.holder}`
            : '';

        return `📢 PayCheck❗정산이 요청됐어요 📢\n${accountInfoText}`;
    }, [accountInfo]);

    const shareToKakao = useCallback(() => {
        if (!kakaoReady) {
            console.warn('Kakao SDK가 아직 준비되지 않았습니다.');
            return;
        }

        const title = generateShareMessage();
        const description = settlementResult && Object.keys(settlementResult).length > 0
            ? `정산 세부 내역을 확인하려면 클릭하세요.\n${Object.entries(settlementResult).map(([name, amount]) => `✅${name} ${amount}원`).join('\n')}`
            : '정산 세부 내역을 확인하려면 클릭하세요.';
        const imageUrl = ""; // TODO: 실제 배포 시에는 유효한 이미지 URL로 변경해야 합니다.
        const linkUrl = "http://localhost:5173/check"; // TODO: 실제 배포 시에는 서비스의 실제 도메인 URL로 변경해야 합니다.

        window.Kakao.Link.sendDefault({
            objectType: 'feed',
            content: {
                title,
                description,
                imageUrl,
                link: {
                    mobileWebUrl: linkUrl,
                    webUrl: linkUrl,
                },
            },
            buttons: [
                {
                    title: '웹으로 보기',
                    link: {
                        mobileWebUrl: linkUrl,
                        webUrl: linkUrl,
                    },
                },
            ],
        });
    }, [kakaoReady, generateShareMessage]);

    const handleShareClick = () => {
        if (kakaoShareButtonRef.current) {
            const rect = kakaoShareButtonRef.current.getBoundingClientRect();
            // 팝업이 버튼 위에 뜨도록 top 위치 조정 (뷰포트 기준)
            setPopupPosition({
                top: rect.top - 20, // 버튼 위로 여백을 20px 줌
                left: rect.left + rect.width / 2,
            });
        }
        setShowAccountPopup(true);
    };

    const handleConfirmAccount = () => {
        setAccountInfo({ holder: tempAccountHolder, number: tempAccountNumber });
        setShowAccountPopup(false);
        shareToKakao();
    };

    const handleCancelAccount = () => {
        setShowAccountPopup(false);
        setTempAccountHolder('');
        setTempAccountNumber('');
    };

    if (loading) {
        return <div>로딩 중...</div>;
    }

    if (error) {
        return <div>오류: {error}</div>;
    }

    if (groupedReceipts.length === 0 && rawReceiptItems.length === 0) {
        return <div>결제 내역이 없습니다.</div>;
    }

    if (groupedReceipts.length === 0 && rawReceiptItems.length > 0) {
        return <div>데이터는 있지만, 처리 중 문제가 발생했습니다.</div>;
    }

    return (
        <div className="flex flex-col items-center w-full min-h-screen p-4">
            <div className="w-full max-w-2xl flex flex-col gap-15">
                <section className="w-full flex flex-col items-center mb-8">
                    <h2 className="text-[40px] font-bold font-['Inter'] text-[#525761] cursor-default">결제 내역</h2>
                    
                    <div className="w-full flex flex-col gap-12 m-8">
                    {groupedReceipts.map((receiptItems, index) => (
                        <ReceiptDetail
                            key={index}
                            receiptId={receiptItems[0].receipt}
                            receiptData={receiptItems}
                            allowedParticipants={allowedParticipants}
                            settleType={settleType}
                            onItemParticipantsChange={handleItemParticipantsUpdate}
                            initialItemAssignments={receiptItemAssignments.get(receiptItems[0].receipt) || []}
                        />
                    ))}
                    </div>

                    <h2 className="text-[32px] font-bold font-['Inter'] text-[#0083FF] cursor-default">총액 {totalAmount}원</h2>
                </section>

                <section className="w-full flex flex-col items-center mb-8">
                    <h2 className="text-[40px] font-bold font-['Inter'] text-[#525761] cursor-default">정산 결과</h2>
                    {settlementResult && Object.keys(settlementResult).length > 0 ? (
                        <div className="mt-8 flex flex-col items-center">
                            <div className="grid grid-cols-2 gap-x-20 gap-y-6">
                                {Object.entries(settlementResult).map(([name, amount]) => (
                                    <React.Fragment key={name}>
                                        <div className="flex justify-start">
                                            <span className="flex items-center bg-[#389EFF]/30 text-[#0069CD] text-[16px] font-['Inter'] font-medium px-4 py-0.5 leading-tight rounded-full border border-[#389EFF]">
                                                {name}
                                            </span>
                                        </div>
                                        <div className="flex justify-end">
                                            <span className="text-[28px] font-bold font-['Inter'] text-[#0083FF]">
                                                {amount}원
                                            </span>
                                        </div>
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    ) : (
                        settleType === 'item' && <p className="mt-4 text-[20px] font-['Inter'] text-[#868686]">정산할 참여자를 지정해주세요.</p>
                    )}
                </section>
                
                <section className="w-full flex flex-col items-center font-bold font-['Inter'] text-white">
                    <div className="flex flex-row gap-15 text-[24px] mb-8">
                        <button className="w-[190px] h-[57px] bg-[#51BE5A] hover:bg-[#46AF4F] duration-200 rounded-[18px] cursor-pointer">
                        엑셀로 내보내기
                        </button>

                        <button
                            ref={kakaoShareButtonRef}
                            className="w-[190px] h-[57px] bg-[#0083FF] hover:bg-[#0069CD] duration-200 rounded-[18px] cursor-pointer"
                            onClick={handleShareClick}
                        >
                            공유하기
                        </button>
                    </div>
                    
                    <button
                        className="w-[122px] h-[46px] bg-[#868686] hover:bg-[#6C6C6C] duration-200 rounded-[16px] cursor-pointer text-[18px]"
                        onClick={() => navigate('/')}
                    >
                    처음으로
                    </button>
                </section>
            </div>

            {showAccountPopup && popupPosition && (
                <div
                    className="fixed bg-white p-6 rounded-lg shadow-lg w-56 z-50"
                    style={{
                        top: popupPosition.top,
                        left: popupPosition.left,
                        transform: 'translate(-50%, -97%)' // 팝업의 중앙이 버튼의 중앙에 오도록, 그리고 위로 이동
                    }}
                >
                    <h3 className="text-lg font-bold font-['Inter'] text-[#525761] mb-4">계좌 정보 입력</h3>
                    <div className="mb-4">
                        <label htmlFor="accountHolder" className="block text-base font-bold font-['Inter'] text-[#525761] mb-2">예금주명</label>
                        <input
                            type="text"
                            id="accountHolder"
                            className="w-full h-[40px] rounded-[12px] bg-[#F5F5F5] px-4 text-base font-['Inter'] outline-none"
                            value={tempAccountHolder}
                            onChange={(e) => setTempAccountHolder(e.target.value)}
                            placeholder="예)홍길동"
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="accountNumber" className="block text-base font-bold font-['Inter'] text-[#525761] mb-2">계좌번호</label>
                        <input
                            type="text"
                            id="accountNumber"
                            className="w-full h-[40px] rounded-[12px] bg-[#F5F5F5] px-4 text-base font-['Inter'] outline-none"
                            value={tempAccountNumber}
                            onChange={(e) => setTempAccountNumber(e.target.value)}
                            placeholder="예)3333123456789"
                        />
                    </div>
                    <div className="flex justify-end gap-4">
                        <button
                            className="w-[80px] h-[40px] rounded-[12px] duration-200 bg-[#389EFF] hover:bg-[#0069CD] cursor-pointer text-white text-base font-bold font-['Inter']"
                            onClick={handleConfirmAccount}
                        >
                            확인
                        </button>
                        <button
                            className="w-[80px] h-[40px] rounded-[12px] duration-200 bg-[#A1A1A1] hover:bg-[#7A7A7A] cursor-pointer text-white text-base font-bold font-['Inter']"
                            onClick={handleCancelAccount}
                        >
                            취소
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CheckPage;