import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
    const navigate = useNavigate();

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