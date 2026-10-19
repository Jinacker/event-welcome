export const CONTACT_MAX_LENGTH = 900;

export function contactError(error) {
  if (error?.code === '400') return '문의 내용을 확인해 주세요. 공백을 제외한 내용이 필요하며 최대 900자까지 보낼 수 있어요.';
  if (error?.code === '401') return '앱 인증을 확인하지 못했어요. 이벤트를 닫고 다시 열어주세요.';
  if (error?.code === '410') return '종료된 이벤트에는 문의를 보낼 수 없어요. 앱 설정의 ‘내 문의’를 이용해 주세요.';
  if (error?.code === '404' || error?.code === '503') return '지금은 문의를 보낼 수 없어요. 잠시 후 다시 시도하거나 앱 설정의 ‘내 문의’를 이용해 주세요.';
  // 타임아웃은 저장 실패로 단정하지 않는다. 자동 재시도하면 같은 문의가 중복 저장될 수 있다.
  return '전송 결과를 확인하지 못했어요. 중복 전송을 피하려면 앱의 ‘내 문의’를 먼저 확인해 주세요.';
}

// React의 다음 렌더 전 연속 클릭도 한 번만 전송한다. 실패 시 자동 재시도하지 않는다.
export function createContactSender(bridge) {
  let pending = null;
  return (value) => {
    if (pending) return pending;
    const content = typeof value === 'string' ? value.trim() : '';
    if (!content || [...content].length > CONTACT_MAX_LENGTH) return Promise.reject(new Error('문의 내용을 1~900자로 입력해 주세요.'));
    if (!bridge.isNative || bridge.isPreview) return Promise.reject(new Error('앱에서 문의를 보낼 수 있어요.'));
    pending = Promise.resolve().then(() => bridge.api('/messages', { method: 'POST', data: { content } }))
      .finally(() => { pending = null; });
    return pending;
  };
}
