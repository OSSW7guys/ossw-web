import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from '../apis/axios';

const CheckPage = () => {

  const navi = useNavigate();
  const receipts = 'back-end query connect';
  const handleResetbtn = () => {
    navi('/');
  }
  return (
    <div className="flex flex-col justify-center items-center font-['Inter']">
      <div className="text-[40px] font-bold text-[#525761] mb-8">결제내역</div>
      <div className="w-8/10 text-[32px] font-bold text-[#51BE5A] mb-4">25/05/08 동국대학교생활협동조합</div>
      <div className="w-8/10 text-[#525761]">
        <div className="grid grid-cols-4 gap-1 text-center text-[32px] font-bold">
          <div>품목</div>
          <div>수량</div>
          <div>금액</div>
          <div>참여자</div>
        </div>
        <div className="grid grid-cols-4 gap-1 text-center text-[28px] mb-[40px]">
          <div>삼겹김치철판</div>
          <div>2</div>
          <div>13000</div>
          <div>모수진</div>
        </div>
      </div>
      <div className="text-[40px] font-bold text-[#0083FF] flex w-3/10">
        <div className="w-1/3 text-left">총액</div>
        <div className="w-2/3 text-right">13000원</div>
      </div>
      <div className="my-[80px]">
        <div className="text-[40px] font-bold text-[#525761]">정산 결과</div>
        <div className="참여자목록">
          <div>하승연</div>
          <div>모수진</div>
        </div>
      </div>
      <div className="w-[500px] my-[50px] flex justify-between text-center text-[28px] font-bold text-[#FFFFFF]">
        <button className="w-[240px] rounded-[16px] px-[8px] py-[16px] bg-[#51BE5A] cursor-pointer">엑셀로 내보내기</button>
        <button className="w-[240px] rounded-[16px] px-[8px] py-[16px] bg-[#0083FF] cursor-pointer">공유하기</button>
      </div>
      <button className="rounded-[16px] w-[136px] py-[13px] mb-[80px] text-center text-[20px] font-bold text-[#ffffff] bg-[#868686] cursor-pointer" onClick={handleResetbtn}>처음으로</button>
    </div>
  )
};

export default CheckPage;