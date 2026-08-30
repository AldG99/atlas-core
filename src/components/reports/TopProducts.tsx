import { useTranslation } from 'react-i18next';
import type { TopProduct } from '../../types/Report';
import { useCurrency } from '../../hooks/useCurrency';
import './TopProducts.scss';

interface TopProductsProps {
  products: TopProduct[];
}

// Cuántas filas se muestran siempre — debe coincidir con el límite que pide
// useReports (calculateTopProducts(..., 5)). Si hay menos productos que esto,
// las filas restantes se dibujan vacías manteniendo su numeración, para que
// la tarjeta no cambie de alto entre períodos con distinta cantidad de datos.
const DISPLAY_COUNT = 5;

const TopProducts = ({ products }: TopProductsProps) => {
  const { t } = useTranslation();
  const { format } = useCurrency();

  const rows = Array.from({ length: DISPLAY_COUNT }, (_, i) => products[i]);

  return (
    <div className="top-products">
      <h3 className="top-products__title">{t('reports.topProducts.title')}</h3>

      <ul className="top-products__list">
        {rows.map((product, index) => (
          <li
            key={product ? `${product.name}-${index}` : `empty-${index}`}
            className={`top-products__item${product ? '' : ' top-products__item--empty'}`}
          >
            <span className="top-products__rank">#{index + 1}</span>
            <span className="top-products__name">
              {product ? (
                <>
                  {product.sku && (
                    <span className="top-products__sku">{product.sku}</span>
                  )}
                  {product.name}
                </>
              ) : '—'}
            </span>
            <span className="top-products__units">
              {product ? `${product.units} ${t('reports.topProducts.sold')}` : ''}
            </span>
            <span
              className={`top-products__profit${product?.profit === undefined ? ' top-products__profit--placeholder' : ''}`}
              title={product?.profit !== undefined ? t('reports.topProducts.profit') : undefined}
            >
              {product?.profit !== undefined ? `+${format(product.profit)}` : ' '}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TopProducts;
