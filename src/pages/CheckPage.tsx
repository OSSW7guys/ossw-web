import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReceiptDetail from '../components/ReceiptDetail';
import { axiosInstance } from '../apis/axios';
import type { Receipt } from '../types/receipt';
import { useLocation } from 'react-router-dom';
import KakaoShareBtn from '../components/KakaoShareBtn';

const CheckPage = () => {
    const [rawReceiptItems, setRawReceiptItems] = useState<Receipt[]>([]);
    const [groupedReceipts, setGroupedReceipts] = useState<Receipt[][]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalAmount, setTotalAmount] = useState<number>(0);
    const [allowedParticipants, setAllowedParticipants] = useState<string[]>([]);

    const navigate = useNavigate();
    const location = useLocation();
    const { settleType } = location.state as { settleType: 'even' | 'item' } || { settleType: 'even' }; // state에서 settleType 가져오기 (기본값 'even')

    useEffect(() => {
        const fetchReceipts = async () => {
            try {
                const response = await axiosInstance.get<{ success: boolean; results: Receipt[] }>('api/receiptinfo/analyze/');
                
                const items = response.data.results;

                setRawReceiptItems(items);
                console.log('API 응답 데이터:', response.data);
                
                const groupedData = groupReceiptItemsByReceiptId(items);
                setGroupedReceipts(groupedData);

                const calculatedTotal = items.reduce((sum, item) => sum + item.total_amount, 0);
                setTotalAmount(calculatedTotal);
                
                const fetchParticipants = async () => {
                    try {
                        const participantResponse = await axiosInstance.get<{ success: boolean; message: string; data: { id: number; name: string }[] }>('api/participant/members/');
                        console.log('GET 요청 응답 데이터:', participantResponse.data);
                        if (participantResponse.data && Array.isArray(participantResponse.data.data)) {
                            setAllowedParticipants(participantResponse.data.data.map(member => member.name));
                        } else {
                            console.error('참여자 명단 데이터 형식이 예상과 다릅니다.', participantResponse.data);
                            setAllowedParticipants([]);
                        }
                    } catch (participantError: any) {
                        console.error('GET 요청 실패:', participantError);
                    }
                };

                fetchParticipants();

            } catch (err: any) {
                console.error('영수증 데이터 불러오기 실패:', err);
                setError('영수증 데이터를 불러오는데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };

        fetchReceipts();
    }, []);

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
                        <ReceiptDetail key={index} receiptData={receiptItems} allowedParticipants={allowedParticipants} settleType={settleType}/>
                    ))}
                    </div>

                    <h2 className="text-[32px] font-bold font-['Inter'] text-[#0083FF] cursor-default">총액 {totalAmount}원</h2>
                </section>

                <section className="w-full flex flex-col items-center mb-8">
                    <h2 className="text-[40px] font-bold font-['Inter'] text-[#525761] cursor-default">정산 결과</h2>

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