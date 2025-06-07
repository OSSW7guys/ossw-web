import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { axiosInstance } from '../apis/axios';
import axios from 'axios';

const LandingPage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // 백엔드 데이터 초기화 API 호출
        const clearBackendData = async () => {
            try {
                const response = await axiosInstance.post('api/receipt/clear_all_data/', {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (response.status === 200) {
                    const data = response.data;
                    console.log('백엔드 데이터 초기화 성공:', data.message);
                } else {
                    const errorData = response.data;
                    console.error('백엔드 데이터 초기화 실패:', errorData.error || '알 수 없는 오류');
                }
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    if (error.response) {
                        console.error('백엔드 데이터 초기화 실패 (응답 오류):', error.response.data);
                    } else if (error.request) {
                        console.error('백엔드 데이터 초기화 실패 (요청 오류): 응답 없음');
                    } else {
                        console.error('API 호출 중 오류 발생:', error.message);
                    }
                } else if (error instanceof Error) {
                    console.error('API 호출 중 일반 오류 발생:', error.message);
                } else {
                    console.error('API 호출 중 알 수 없는 오류 발생');
                }
            }
        };
        clearBackendData();
    }, []); // 빈 의존성 배열은 컴포넌트 마운트 시 한 번만 실행되도록 함

    const handleStartClick = () => {
        navigate('/main'); // MainPage 경로로 이동
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#EDEDED]">
            <div className="flex flex-col items-center justify-center w-full gap-[10px] px-4 pt-[170px]">
                <span className="font-['inter'] font-bold text-[42px] text-[#525761] cursor-default">나만의 회계 비서,</span>
                
                <img src='/logo.svg' alt='logo' className="w-[597px] h-[143px]"/>

                <button
                    className="w-[200px] h-[60px] rounded-[12px] bg-[#0083FF] text-white text-[24px] font-bold font-['Inter'] mt-[40px] hover:bg-[#0069CD] duration-200 cursor-pointer"
                    onClick={handleStartClick}
                >
                    시작하기
                </button>

                <div className="mt-[80px] text-center">
                    <img src="/barcode.svg" alt="barcode" className="w-[312px] h-[106px]"/>
                    <span className="font-['inter'] font-bold text-[18px] text-[#525761] tracking-[1em] block cursor-default">ChillGuys!</span>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;