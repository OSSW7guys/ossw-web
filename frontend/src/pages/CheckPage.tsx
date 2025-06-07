import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReceiptDetail from '../components/ReceiptDetail';
import { axiosInstance } from '../apis/axios';
import type { Receipt } from '../types/receipt';
import { useLocation } from 'react-router-dom';
import KakaoShareBtn from '../components/KakaoShareBtn';
import React from 'react';

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

    const navigate = useNavigate();
    const location = useLocation();
    const { settleType } = location.state as { settleType: 'even' | 'item' } || { settleType: 'even' }; // state에서 settleType 가져오기 (기본값 'even')

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
                            receiptId={receiptItems[0].receipt} // receiptId prop 추가
                            receiptData={receiptItems}
                            allowedParticipants={allowedParticipants}
                            settleType={settleType}
                            onItemParticipantsChange={handleItemParticipantsUpdate} // 콜백 prop 추가
                            initialItemAssignments={receiptItemAssignments.get(receiptItems[0].receipt) || []} // 추가: 초기 품목별 참여자 할당
                        />
                    ))}
                    </div>

                    <h2 className="text-[32px] font-bold font-['Inter'] text-[#0083FF] cursor-default">총액 {totalAmount}원</h2>
                </section>

                <section className="w-full flex flex-col items-center mb-8">
                    <h2 className="text-[40px] font-bold font-['Inter'] text-[#525761] cursor-default">정산 결과</h2>
                    {/* 정산 결과 표시 */}
                    {settlementResult && Object.keys(settlementResult).length > 0 ? (
                        <div className="mt-8 flex flex-col items-center">
                            <div className="grid grid-cols-2 gap-x-20 gap-y-6">
                                {Object.entries(settlementResult).map(([name, amount]) => (
                                    <React.Fragment key={name}>
                                        <div className="flex justify-start">
                                            <span className="flex items-center bg-[#389EFF]/30 text-[#0069CD] text-[16px] font-['Inter'] font-medium px-4 rounded-full border border-[#389EFF]">
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

                        <KakaoShareBtn
                          title="공유 내용을 확인하세요"
                          description="정산 세부 내역을 확인하려면 클릭하세요."
                          imageUrl=""
                          linkUrl="http://localhost:5173/"
                        />   
                    </div>
                    
                    <button
                        className="w-[122px] h-[46px] bg-[#868686] hover:bg-[#6C6C6C] duration-200 rounded-[16px] cursor-pointer text-[18px]"
                        onClick={() => navigate('/')}
                    >
                    처음으로
                    </button>
                </section>
            </div>
        </div>
    );
};

export default CheckPage;