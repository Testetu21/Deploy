import React, { type SVGProps } from "react";

function BaseIcon(props: SVGProps<SVGSVGElement>) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props} />;
}

export const IconPlus = (props: SVGProps<SVGSVGElement>) => (
  <BaseIcon {...props}><path d="M12 5v14" /><path d="M5 12h14" /></BaseIcon>
);

export const IconEdit = (props: SVGProps<SVGSVGElement>) => (
  <BaseIcon {...props}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></BaseIcon>
);

export const IconTrash = (props: SVGProps<SVGSVGElement>) => (
  <BaseIcon {...props}><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></BaseIcon>
);

export const IconSearch = (props: SVGProps<SVGSVGElement>) => (
  <BaseIcon {...props}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></BaseIcon>
);

export const IconDown = (props: SVGProps<SVGSVGElement>) => (
  <BaseIcon {...props}><path d="M12 4v12" /><path d="M7 11l5 5 5-5" /><path d="M5 20h14" /></BaseIcon>
);

export const IconClock = (props: SVGProps<SVGSVGElement>) => (
  <BaseIcon {...props}><circle cx="12" cy="12" r="9" /><path d="M12 7v6l4 2" /></BaseIcon>
);

export const IconCheck = (props: SVGProps<SVGSVGElement>) => (
  <BaseIcon {...props}><path d="M20 6 9 17l-5-5" /></BaseIcon>
);

export const IconAlert = (props: SVGProps<SVGSVGElement>) => (
  <BaseIcon {...props}><path d="M10.3 4.3 1.8 19a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0z" /><path d="M12 9v4" /><path d="M12 17h.01" /></BaseIcon>
);

export const IconMoney = (props: SVGProps<SVGSVGElement>) => (
  <BaseIcon {...props}><path d="M12 1v22" /><path d="M17 5.5c-1.2-1.4-3.4-2.2-5.4-2.2C8.6 3.3 6 4.8 6 7.6c0 5.2 12 2.3 12 7.4 0 2.9-2.6 4.4-5.6 4.4-2 0-4.2-.8-5.4-2.2" /></BaseIcon>
);

export const IconUsers = (props: SVGProps<SVGSVGElement>) => (
  <BaseIcon {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.9" /><path d="M16 3.3a4 4 0 0 1 0 7.4" /></BaseIcon>
);

export const IconPhone = (props: SVGProps<SVGSVGElement>) => (
  <BaseIcon {...props}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.3 19.3 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6.1 6.1l1.2-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z" /></BaseIcon>
);

export const IconBox = (props: SVGProps<SVGSVGElement>) => (
  <BaseIcon {...props}><path d="m3 7 9-4 9 4-9 4-9-4z" /><path d="m3 7 9 4 9-4" /><path d="m12 11v10" /><path d="m3 7 9 4 9-4v10l-9 4-9-4V7z" /></BaseIcon>
);

export const IconBuilding = (props: SVGProps<SVGSVGElement>) => (
  <BaseIcon {...props}><path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-4h6v4" /><path d="M9 11h.01" /><path d="M15 11h.01" /><path d="M9 15h.01" /><path d="M15 15h.01" /></BaseIcon>
);

export const IconCart = (props: SVGProps<SVGSVGElement>) => (
  <BaseIcon {...props}><circle cx="9" cy="20" r="1" /><circle cx="18" cy="20" r="1" /><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L22 8H7" /></BaseIcon>
);

export const IconTool = (props: SVGProps<SVGSVGElement>) => (
  <BaseIcon {...props}><path d="M14.7 6.3a6 6 0 0 0-7.4 7.4l-4.8 4.8a2 2 0 0 0 2.8 2.8l4.8-4.8a6 6 0 0 0 7.4-7.4l-3.3 3.3-3-3z" /></BaseIcon>
);

export const IconTruck = (props: SVGProps<SVGSVGElement>) => (
  <BaseIcon {...props}><path d="M3 7h11v10H3z" /><path d="M14 10h4l3 3v4h-7" /><circle cx="7" cy="19" r="2" /><circle cx="17" cy="19" r="2" /></BaseIcon>
);

export const IconCard = (props: SVGProps<SVGSVGElement>) => (
  <BaseIcon {...props}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18" /><path d="M7 15h3" /></BaseIcon>
);

export const IconChart = (props: SVGProps<SVGSVGElement>) => (
  <BaseIcon {...props}><path d="M4 19V5" /><path d="M4 19h16" /><path d="M8 15v-4" /><path d="M12 15V7" /><path d="M16 15v-6" /></BaseIcon>
);

export const IconEye = (props: SVGProps<SVGSVGElement>) => (
  <BaseIcon {...props}><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" /><circle cx="12" cy="12" r="3" /></BaseIcon>
);
