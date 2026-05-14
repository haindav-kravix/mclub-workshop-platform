import React from 'react';

export const BrandMark = ({ compact = false, dark = false }) => (
  <div className="flex flex-none items-center gap-2 sm:gap-3 max-w-full">
    <img
      src="/brand/klh-head-banner.png"
      alt="KLH University"
      className={`${compact ? 'h-7 w-[min(42vw,200px)] sm:h-8 sm:w-[230px] lg:h-9 lg:w-[280px]' : 'h-12 w-[min(70vw,300px)] sm:h-16 sm:w-[min(58vw,430px)] lg:h-20 lg:w-[500px]'} object-contain flex-none`}
    />
    <div className={`${compact ? 'w-8 h-8 text-xs sm:w-9 sm:h-9 sm:text-sm' : 'w-11 h-11 text-sm sm:w-14 sm:h-14 sm:text-lg'} rounded-lg flex items-center justify-center font-bold shadow-sm flex-none ${
      dark ? 'bg-white text-secondary' : 'bg-secondary text-white'
    }`}>
      MC
    </div>
  </div>
);
