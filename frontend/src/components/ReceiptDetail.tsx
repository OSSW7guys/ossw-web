import React, { useState } from 'react';
import type { Receipt } from '../types/receipt'; // types/receipt 파일 경로 확인 필요

interface ReceiptDetailProps {
    receiptData: Receipt[]; // 영수증 품목 데이터 배열
}

const ReceiptDetail: React.FC<ReceiptDetailProps> = ({ receiptData }) => {
    // 영수증 데이터가 없거나 비어있으면 처리
    if (!receiptData || receiptData.length === 0) {
        return <div>영수증 내역이 없습니다.</div>;
    }

    // 상호명은 첫 번째 품목 데이터에서 가져옴
    const storeName = receiptData[0].store_name;

    // 각 품목별 참여자를 관리하기 위한 상태 (품목 index -> 참여자 이름 배열)
    // 초기 상태는 각 품목에 대해 빈 참여자 배열로 설정
    const [itemParticipants, setItemParticipants] = useState<string[][]>(
        receiptData.map(() => [])
    );

    // 특정 품목에 참여자 태그 추가 핸들러
    const handleAddParticipant = (itemIndex: number, participantName: string) => {
        if (participantName.trim() === '') return;

        setItemParticipants(prevParticipants => {
            const newParticipants = [...prevParticipants];
            // 해당 품목의 참여자 목록에 추가 (중복 방지)
            if (!newParticipants[itemIndex].includes(participantName.trim())) {
                 newParticipants[itemIndex] = [...newParticipants[itemIndex], participantName.trim()];
            }
            return newParticipants;
        });
    };

    // 특정 품목의 참여자 태그 삭제 핸들러
    const handleRemoveParticipant = (itemIndex: number, participantToRemove: string) => {
         setItemParticipants(prevParticipants => {
             const newParticipants = [...prevParticipants];
             newParticipants[itemIndex] = newParticipants[itemIndex].filter(
                 participant => participant !== participantToRemove
             );
             return newParticipants;
         });
    };


    return (
        <div className="receipt-detail-container w-full cursor-default"> {/* 전체 컨테이너 너비 꽉 채우기 */}
            {/* 상호명 및 날짜 */}
            <h2 className="text-[28px] font-bold font-['Inter'] text-[#51BE5A] mb-4">{storeName}</h2>

            {/* 영수증 품목 테이블 */}
            <table className="receipt-items-table w-full border-collapse"> {/* 테이블 너비 꽉 채우기, 테두리 병합 */}
                <thead className="text-left"> {/* 헤더 텍스트 좌측 정렬 */}
                    <tr className="text-[24px] font-bold font-['Inter'] text-[#525761]">
                        <th className="w-2/5 px-2 pb-2">품목</th> {/* 품목 열 너비 설정 */}
                        <th className="w-1/5 px-2 pb-2">수량</th> {/* 수량 열 너비 설정 */}
                        <th className="w-1/5 px-2 pb-2">금액</th> {/* 금액 열 너비 설정 */}
                        <th className="w-1/5 px-2 pb-2 text-center">참여자</th>
                    </tr>
                </thead>
                <tbody>
                    {receiptData.map((item, index) => (
                        <React.Fragment key={index}>
                            <tr className="text-[21px] font-bold font-['Inter'] text-[#525761]">
                                <td className="px-2 py-3">{item.item_name}</td>
                                <td className="px-2 py-3">{item.quantity}</td>
                                <td className="px-2 py-3">{item.total_amount}</td>
                                <td className="px-2 py-3 relative"> {/* 상대 위치 설정 */}
                                    <input
                                        type="text"
                                        placeholder="참여자 추가"
                                        className="w-[200px] h-[40px] rounded-[12px] text-[16px] font-medium outline-none bg-[#F5F5F5] px-3"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const inputElement = e.target as HTMLInputElement;
                                                handleAddParticipant(index, inputElement.value);
                                                inputElement.value = '';
                                            }
                                        }}
                                    />
                                </td>
                            </tr>
                            {itemParticipants[index].length > 0 && (
                                <tr key={`tags-${index}`}>
                                    <td colSpan={4} className="px-2 pt-2 pb-4">
                                        <div className="flex flex-wrap gap-2 justify-end">
                                            {itemParticipants[index].map((participant, pIndex) => (
                                                <span key={pIndex} className="flex items-center bg-[#389EFF]/30 text-[#0069CD] text-sm font-['Inter'] font-medium px-2 py-1 rounded-full border border-[#389EFF]">
                                                    <span className="truncate">{participant}</span>
                                                    <button
                                                        className="ml-1 text-[#0069CD] hover:text-[#004080] focus:outline-none cursor-pointer"
                                                        onClick={() => handleRemoveParticipant(index, participant)}
                                                        aria-label="참여자 삭제"
                                                        type="button"
                                                    >
                                                        ×
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ReceiptDetail;