declare module 'input-otp' {
  import * as React from 'react';

  export interface OTPInputProps {
    maxLength?: number;
    value?: string;
    onChange?: (value: string) => void;
    pattern?: RegExp;
    disabled?: boolean;
    containerClassName?: string;
    itemClassName?: string;
    itemActiveClassName?: string;
    itemFocusClassName?: string;
    itemErrorClassName?: string;
    itemFilledClassName?: string;
    itemDisabledClassName?: string;
    render?: (props: {
      slots: Array<{
        char: string;
        hasFakeCaret: boolean;
        isActive: boolean;
      }>;
    }) => React.ReactNode;
  }

  export const OTPInput: React.FC<OTPInputProps>;
  
  export interface OTPInputContextType {
    slots: Array<{
      char: string;
      hasFakeCaret: boolean;
      isActive: boolean;
    }>;
  }
  
  export const OTPInputContext: React.Context<OTPInputContextType>;
}