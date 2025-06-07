import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col min-h-screen bg-[#EDEDED]">
      <nav className="w-full h-[80px] box-border text-[#525761] px-8">
        <div
          className="flex flex-col items-left w-full cursor-pointer"
          onClick={() => navigate('/')}>
          <img
            src="/barcode.svg"
            alt="바코드 로고"
            className="w-[140px] h-[47px]"
          />
          <div className="text-[28px] font-black font-['Inter'] mt-[-8px]">PayCheck</div>
        </div>
      </nav>
      {/* 메인 컨텐츠 */}
      <main className="flex-1 flex flex-col">{children}</main>
      {/* 푸터 */}
      <footer className="w-full h-16 text-[#525761] flex items-center justify-center">
        <span className="text-sm font-bold text-[18px] font-['Inter'] mx-auto cursor-default">ChillGuys!</span>
      </footer>
    </div>
  );
};

export default Layout; 