import { useNavigate } from 'react-router-dom'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { formatPrice, formatMarketCap } from '../utils/formatters'
import CoinIcon from './CoinIcon'
import './CoinCard.css'

export default function CoinCard({ coin }) {
  const navigate = useNavigate()
  const isPos = (coin.change_24h ?? 0) >= 0

  return (
    <div
      className="coin-card card"
      onClick={() => navigate(`/coin/${coin.symbol}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(`/coin/${coin.symbol}`)}
    >
      <div className="coin-card-header">
        <div className="coin-card-rank">#{coin.rank}</div>
        <div className="coin-card-meta">
          <CoinIcon symbol={coin.symbol} size={36} />
          <div>
            <div className="coin-card-name">{coin.name}</div>
            <div className="coin-card-symbol">{coin.symbol}</div>
          </div>
        </div>
      </div>

      <div className="coin-card-price">{formatPrice(coin.price)}</div>

      <div className="coin-card-footer">
        <span className={`badge ${isPos ? 'badge-gain' : 'badge-loss'}`}>
          {isPos ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {coin.change_24h != null
            ? (isPos ? '+' : '') + coin.change_24h.toFixed(2) + '%'
            : '—'}
        </span>
        <span className="coin-card-mcap">{formatMarketCap(coin.market_cap)}</span>
      </div>
    </div>
  )
}
