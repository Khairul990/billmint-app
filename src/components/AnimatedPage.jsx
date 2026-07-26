import { pageVariants } from '../utils/animations';

const AnimatedPage = ({ children, className = '', ...props }) => {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedPage;