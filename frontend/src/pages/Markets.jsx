import { useCoins } from '../hooks/useCoins'
import MarketTable from '../components/MarketTable'
import CoinCard from '../components/CoinCard'
import { AlertCircle } from 'lucide-react'

export default function Markets() {
  const { coins, loading, error } = useCoins()

  return (
    <div>
      <div className="page-header">
        <h1>Markets</h1>
        <p>Top 10 cryptocurrencies by market capitalisation</p>
      </div>

      {error && (
        <div className="alert alert-warning" style={{ marginBottom: 20 }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Full table */}
      <section style={{ marginBottom: 32 }}>
        <MarketTable coins={coins} loading={loading} />
      </section>

      {/* Card grid for mobile */}
      <section>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
          Coin Cards
        </h2>
        <div className="grid-4">
          {loading
            ? Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="card" style={{ height: 140 }}>
                  <div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: 10 }} />
                </div>
              ))
            : coins.map(coin => <CoinCard key={coin.symbol} coin={coin} />)
          }
        </div>
      </section>
    </div>
  )
}
