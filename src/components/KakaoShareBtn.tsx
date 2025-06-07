import { useEffect } from 'react';

declare global {
  interface Window {
    Kakao: any;
  }
}

interface KakaoShareButtonProps {
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
}

export default function KakaoShareBtn({
  title,
  description,
  imageUrl,
  linkUrl,
}: KakaoShareButtonProps) {
  useEffect(() => {
    // Kakao SDK 스크립트 추가
    if (!window.Kakao && !document.getElementById('kakao-sdk')) {
      const script = document.createElement('script');
      script.id = 'kakao-sdk';
      script.src = 'https://developers.kakao.com/sdk/js/kakao.js';
      script.onload = () => {
        window.Kakao.init('c4913a27ee144670505405de9ee16631'); // 카카오 JavaScript 키
        console.log('Kakao SDK initialized:', window.Kakao.isInitialized());
      };
      document.head.appendChild(script);
    } else if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init('c4913a27ee144670505405de9ee16631'); // 이미 로드된 경우 초기화만
    }
  }, []);

  const shareToKakao = () => {
    if (!window.Kakao) return;

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
  };

  return (
    <button
      className="px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 transition"
      onClick={shareToKakao}
    >
      공유하기
    </button>
  );
}
