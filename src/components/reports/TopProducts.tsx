import { useTranslation } from 'react-i18next';
import type { TopProduct } from '../../types/Report';
import { useCurrency } from '../../hooks/useCurrency';
import './TopProducts.scss';

interface TopProductsProps {
  products: TopProduct[];
}

const TopProducts = ({ products }: TopProductsProps) => {
  const { t } = useTranslation();
  const { format } = useCurrency();
  return (
    <div className="top-products">
      <h3 className="top-products__title">{t('reports.topProducts.title')}</h3>

      {products.length === 0 ? (
        <p className="top-products__empty">{t('reports.topProducts.empty')}</p>
      ) : (
        <ul className="top-products__list">
          {products.map((product, index) => (
            <li key={`${product.name}-${index}`} className="top-products__item">
              <div className="top-products__rank">#{index + 1}</div>
              <div className="top-products__info">
                <span className="top-products__name">
                  {product.sku && (
                    <span className="top-products__sku">{product.sku}</span>
                  )}
                  {product.name}
                </span>
              </div>
              <div className="top-products__stats">
                <span className="top-products__units">{product.units} {t('reports.topProducts.sold')}</span>
                {product.profit !== undefined && (
                  <span className="top-products__profit">+{format(product.profit)} {t('reports.topProducts.profit')}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TopProducts;
