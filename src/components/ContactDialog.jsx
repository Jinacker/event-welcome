import React, { useMemo, useRef, useState } from 'react';
import EventDialog from './EventDialog';
import { contact } from '../events/seongbukcheonContent';
import { CONTACT_MAX_LENGTH, contactError, createContactSender } from '../lib/contact';

export default function ContactDialog({ bridge, onClose }) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const locked = useRef(false);
  const send = useMemo(() => createContactSender(bridge), [bridge]);
  const canSend = bridge.isNative && !bridge.isPreview;
  const length = [...content].length;
  const submit = async (action) => {
    action.preventDefault();
    if (locked.current || sent || !canSend || !content.trim() || length > CONTACT_MAX_LENGTH) return;
    locked.current = true;
    setSending(true); setError('');
    try { await send(content); setSent(true); setContent(''); }
    catch (cause) { setError(contactError(cause)); }
    finally { locked.current = false; setSending(false); }
  };
  const openMessages = async () => {
    try { await bridge.navigate('messages'); }
    catch { setError('내 문의를 열지 못했어요. 앱 설정에서 ‘내 문의’를 확인해 주세요.'); }
  };
  return <EventDialog title={contact.title} className="contact-dialog" closeLabel="운영 문의 닫기" onClose={onClose}>
    <div className="contact-copy">
      <p>{contact.intro}</p>
      <p className="contact-instagram"><strong>{contact.instagram}</strong></p>
      <p className="contact-help">{contact.help}</p>
      <section className="contact-venue">
        <h3>{contact.venueTitle}</h3>
        <p>{contact.venue}</p>
        <p>{contact.hours}</p>
      </section>
      <p className="policy-note">{contact.notice}</p>
    </div>
    <details className="contact-form-section" aria-label="앱으로 운영 문의 보내기">
      <summary>앱으로 문의하기<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg></summary>
      <div className="contact-form-content">
        {canSend ? sent ? <div role="status" className="contact-success">
          <strong>문의가 전송되었어요.</strong>
          <p>답변은 앱의 ‘내 문의’에서 확인할 수 있어요.</p>
        </div> : <form onSubmit={submit} aria-busy={sending}>
          <label htmlFor="event-contact-content">문의 내용</label>
          <textarea id="event-contact-content" value={content} onChange={(action) => setContent(action.target.value)}
            rows={5} required disabled={sending} aria-describedby="event-contact-help event-contact-count"
            placeholder="궁금한 점이나 불편했던 내용을 적어주세요." />
          <p id="event-contact-count" className="contact-count" aria-live="off">{length} / {CONTACT_MAX_LENGTH}자</p>
          <p id="event-contact-help" className="contact-help">앱 계정으로 접수되며, 답변은 앱의 ‘내 문의’에서 확인할 수 있어요. 화면 사진은 인스타그램 DM으로 보내주세요.</p>
          <button type="submit" className="contact-submit" disabled={sending || !content.trim() || length > CONTACT_MAX_LENGTH}>{sending ? '전송 중…' : '문의 보내기'}</button>
        </form> : <p className="contact-help">{bridge.isPreview ? '미리보기에서는 문의가 전송되지 않습니다.' : '앱에서 이벤트를 열면 바로 문의를 보낼 수 있어요. 인스타그램 DM으로도 문의할 수 있습니다.'}</p>}
        {error && <p className="contact-error" role="alert">{error}</p>}
        {canSend && <button type="button" className="contact-messages" disabled={sending} onClick={openMessages}>내 문의 보기</button>}
      </div>
    </details>
  </EventDialog>;
}
