import React, { useState, useEffect } from 'react';
import type { Receipt } from '../types/receipt'; // types/receipt 파일 경로 확인 필요

interface ReceiptDetailProps {
    receiptData: Receipt[]; // 영수증 품목 데이터 배열
    allowedParticipants: string[]; // 추가: 허용된 참여자 명단
    settleType: 'even' | 'item'; // 추가: 정산 방식
    receiptId: number; // 추가: 현재 영수증의 ID
    onItemParticipantsChange: (receiptId: number, itemIndex: number, updatedParticipants: string[]) => void; // 추가: 품목별 참여자 변경 시 호출될 콜백
    initialItemAssignments: Array<{ item_name: string; participants: string[] }>; // 추가: 초기 품목별 참여자 할당
}

const ReceiptDetail: React.FC<ReceiptDetailProps> = ({ receiptData, allowedParticipants, settleType, receiptId, onItemParticipantsChange, initialItemAssignments }) => {
    // 영수증 데이터가 없거나 비어있으면 처리
    if (!receiptData || receiptData.length === 0) {
        return <div>영수증 내역이 없습니다.</div>;
    }

    // 상호명은 첫 번째 품목 데이터에서 가져옴
    const storeName = receiptData[0].store_name;

    // 각 품목별 참여자를 관리하기 위한 상태 (품목 index -> 참여자 이름 배열)
    const [itemParticipants, setItemParticipants] = useState<string[][]>(
        receiptData.map((item) => {
            if (settleType === 'even') {
                return allowedParticipants;
            } else {
                // initialItemAssignments에서 해당 품목의 참여자 정보를 찾아 초기값으로 설정
                const assignment = initialItemAssignments.find(a => a.item_name === item.item_name);
                return assignment ? assignment.participants : [];
            }
        })
    );

    // settleType 또는 allowedParticipants가 변경될 때 itemParticipants 상태를 업데이트
    useEffect(() => {
        if (settleType === 'even') {
            setItemParticipants(receiptData.map(() => allowedParticipants));
        } else {
            // settleType이 'item'으로 변경될 때 초기 할당 데이터를 기반으로 다시 설정
            setItemParticipants(receiptData.map((item) => {
                const assignment = initialItemAssignments.find(a => a.item_name === item.item_name);
                return assignment ? assignment.participants : [];
            }));
        }
    }, [settleType, allowedParticipants, receiptData, initialItemAssignments]); // 의존성 배열에 initialItemAssignments 추가

    // 각 품목별 오류 메시지를 관리하기 위한 상태 (품목 index -> 오류 메시지 문자열)
    const [itemErrors, setItemErrors] = useState<string[]>(
        receiptData.map(() => '')
    );

    // 특정 품목에 참여자 태그 추가 핸들러
    const handleAddParticipant = (itemIndex: number, participantName: string) => {
        const trimmedName = participantName.trim();

        // 입력이 비어있으면 오류 메시지 제거 후 종료
        if (trimmedName === '') {
            setItemErrors(prevErrors => {
                const newErrors = [...prevErrors];
                newErrors[itemIndex] = '';
                return newErrors;
            });
            return;
        }

        // 허용된 참여자 명단에 있는지 확인
        if (!allowedParticipants.includes(trimmedName)) {
            // 명단에 없으면 오류 메시지 설정
            setItemErrors(prevErrors => {
                const newErrors = [...prevErrors];
                newErrors[itemIndex] = '리스트에 있는 이름이 아닙니다';
                return newErrors;
            });
            return; // 참여자 추가 방지
        }

        // 명단에 있으면 오류 메시지 제거 및 참여자 추가
        setItemErrors(prevErrors => {
            const newErrors = [...prevErrors];
            newErrors[itemIndex] = ''; // 성공 시 오류 메시지 초기화
            return newErrors;
        });

        setItemParticipants(prevParticipants => {
            const newParticipants = [...prevParticipants];
            // 해당 품목의 참여자 목록에 추가 (중복 방지)
            if (!newParticipants[itemIndex].includes(trimmedName)) {
                 newParticipants[itemIndex] = [...newParticipants[itemIndex], trimmedName];
            }
            // 항목별 정산일 경우 변경사항을 부모 컴포넌트에 알림
            if (settleType === 'item') {
                onItemParticipantsChange(receiptId, itemIndex, newParticipants[itemIndex]);
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
             // 항목별 정산일 경우 변경사항을 부모 컴포넌트에 알림
             if (settleType === 'item') {
                onItemParticipantsChange(receiptId, itemIndex, newParticipants[itemIndex]);
            }
             return newParticipants;
         });
    };

    // 입력 필드 내용 변경 시 해당 품목의 오류 메시지 제거
    const handleInputChange = (itemIndex: number) => {
        setItemErrors(prevErrors => {
            const newErrors = [...prevErrors];
            newErrors[itemIndex] = '';
            return newErrors;
        });
    };

    return (
        <div className="receipt-detail-container w-full cursor-default"> {/* 전체 컨테이너 너비 꽉 채우기 */}
            {/* 상호명 및 날짜 */}
            <h2 className="text-[28px] font-bold font-['Inter'] text-[#51BE5A] mb-4">{storeName}</h2>

            {/* 영수증 품목 테이블 */}
            <table className="receipt-items-table w-full border-collapse"> {/* 테이블 너비 꽉 채우기, 테두리 병합 */}
                <thead className="text-left">
                    <tr className="text-[24px] font-bold font-['Inter'] text-[#525761]">
                        <th className="w-2/5 px-2 pb-2">품목</th>
                        <th className="w-1/5 px-2 pb-2">수량</th>
                        <th className="w-1/5 px-2 pb-2">금액</th>
                        {settleType !== 'even' && (
                            <th className="w-1/5 px-2 pb-2 text-center">참여자</th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {receiptData.map((item, index) => (
                        <React.Fragment key={index}>
                            <tr className="text-[21px] font-bold font-['Inter'] text-[#525761]">
                                <td className="px-2 py-3">{item.item_name}</td>
                                <td className="px-2 py-3">{item.quantity}</td>
                                <td className="px-2 py-3">{item.total_amount}</td>
                                {settleType !== 'even' && (
                                    <td className="px-2 py-3 relative">
                                        {/* 오류 메시지 표시 */}
                                        {itemErrors[index] && (
                                            <p className="text-red-500 text-sm absolute bottom-13 left-0 w-full text-left px-3">{itemErrors[index]}</p>
                                        )}
                                        <input
                                            type="text"
                                            placeholder="참여자 추가"
                                            className="w-[200px] h-[40px] rounded-[12px] text-[16px] font-medium outline-none bg-[#F5F5F5] px-3"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    const inputElement = e.target as HTMLInputElement;
                                                    handleAddParticipant(index, inputElement.value);
                                                    // 참여자 추가 후 입력 필드 초기화
                                                    inputElement.value = '';
                                                }
                                            }}
                                            onChange={() => handleInputChange(index)} // 입력 변경 시 오류 메시지 제거
                                        />
                                    </td>
                                )}
                            </tr>
                            {settleType !== 'even' && itemParticipants[index].length > 0 && (
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