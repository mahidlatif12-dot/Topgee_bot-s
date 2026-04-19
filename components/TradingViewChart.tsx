'use client'

export default function TradingViewChart() {
  return (
    <div style={{ width: '100%', height: '600px', borderRadius: '8px', overflow: 'hidden' }}>
      <iframe
        src="https://s.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=OANDA%3AXAUUSD&interval=D&hidesidetoolbar=0&hidetoptoolbar=0&symboledit=1&saveimage=0&toolbarbg=16161f&studies=[]&theme=dark&style=1&timezone=Asia%2FKarachi&withdateranges=1&showpopupbutton=1&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=en&utm_source=localhost"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
        }}
        allowFullScreen
      />
    </div>
  )
}
