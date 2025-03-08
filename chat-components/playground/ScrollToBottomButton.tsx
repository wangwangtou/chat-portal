import React from 'react';
import {ArrowDownIcon} from '@heroicons/react/24/outline';

interface ScrollToBottomButtonProps {
  onClick: () => void;
}

export const ScrollToBottomButton: React.FC<ScrollToBottomButtonProps> = ({onClick}) => {
  return (
      <button className="scroll-to-bottom-button">
        <div onClick={onClick}>
          <ArrowDownIcon className="h-4 w-4 text-black" strokeWidth={2.5}/>
        </div>
      </button>
  );
};