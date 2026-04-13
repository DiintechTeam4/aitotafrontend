export function TemplatePreview({ name, bodyPreview, languageCode, whatsappTemplateName }) {
  return (
    <div className="rounded-xl border border-[#334155] bg-[#0F172A] p-4">
      <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
        <span>WhatsApp preview</span>
        <span>{languageCode || 'en'}</span>
      </div>
      <div className="rounded-lg bg-[#128C7E]/30 p-3 text-sm text-[#F1F5F9]">
        <div className="mb-1 font-medium text-[#25D366]">{name}</div>
        <div className="text-xs text-slate-400 mb-2">Template: {whatsappTemplateName}</div>
        <p className="whitespace-pre-wrap">{bodyPreview || 'No body preview saved.'}</p>
      </div>
    </div>
  )
}
