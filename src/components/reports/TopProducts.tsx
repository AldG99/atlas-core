import { useTranslation } from 'react-i18next';
import type { TopProduct } from '../../types/Report';
import './TopProducts.scss';

interface TopProductsProps {
  products: TopProduct[];
}

const TopProducts = ({ products }: TopProductsProps) => {
  const { t } = useTranslation();
  return (
    <div className="top-productos">
      <h3 className="top-productos__title">{t('reports.topProducts.title')}</h3>

      {products.length === 0 ? (
        <p className="top-productos__empty">{t('reports.topProducts.empty')}</p>
      ) : (
        <ul className="top-productos__list">
          {products.map((product, index) => (
            <li key={`${product.name}-${index}`} className="top-productos__item">
              <div className="top-productos__rank">#{index + 1}</div>
              <div className="top-productos__info">
                <span className="top-productos__name">
                  {product.sku && (
                    <span className="top-productos__clave">{product.sku}</span>
                  )}
                  {product.name}
                </span>
              </div>
              <span className="top-productos__unidades">{product.units} {t('reports.topProducts.sold')}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TopProducts;
