"use client";

import Script from "next/script";

type MyChatBotOyna = {
  MyChatBot?: {
    mount: (selektor: string, sozlamalar: Record<string, unknown>) => void;
  };
};

/**
 * AI mentor — MyChatBot sayt widgeti.
 * Skript yuklangach pastki o‘ng burchakda suhbat tugmasi paydo bo‘ladi.
 */
export function AiMentorWidget() {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://storage.googleapis.com/mychatbot-widget-assets/v1/style.css"
      />
      <div id="my-chat-widget-container" />
      <Script
        src="https://storage.googleapis.com/mychatbot-widget-assets/v1/widget.js"
        strategy="afterInteractive"
        onLoad={() => {
          const oyna = window as unknown as MyChatBotOyna;
          oyna.MyChatBot?.mount("#my-chat-widget-container", {
            account_id: "9754b595-8eb8-415c-9464-c52212deff6a",
            widget_id: "site-38891",
            api_url: "https://api.mychatbot.app",
            assistant_name: "Ustozim Nurim yordamchisi",
            color: "#e5b454",
            lang: "en",
            ad_widget_title: "",
            ad_widget_description: "",
            ad_popup_messages: [],
          });
        }}
      />
    </>
  );
}
