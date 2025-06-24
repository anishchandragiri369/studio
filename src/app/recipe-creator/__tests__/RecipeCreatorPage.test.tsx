import { render, screen } from '@testing-library/react';
import RecipeCreatorPage from '../page';

// Mock the RecipeCreatorClient component
jest.mock('@/components/recipe-creator/RecipeCreatorClient', () => {
  return function MockRecipeCreatorClient() {
    return <div data-testid="recipe-creator-client">Recipe Creator Component</div>;
  };
});

describe('RecipeCreatorPage', () => {
  it('renders the recipe creator page with title and description', () => {
    render(<RecipeCreatorPage />);
    
    expect(screen.getByText('AI Juice Recipe Creator')).toBeInTheDocument();
    expect(screen.getByText(/Unleash your creativity or discover new combinations/)).toBeInTheDocument();
  });

  it('renders the RecipeCreatorClient component', () => {
    render(<RecipeCreatorPage />);
    
    expect(screen.getByTestId('recipe-creator-client')).toBeInTheDocument();
  });

  it('has proper heading structure', () => {
    render(<RecipeCreatorPage />);
    
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('AI Juice Recipe Creator');
  });

  it('includes description text about AI recipe creation', () => {
    render(<RecipeCreatorPage />);
    
    expect(screen.getByText(/Tell our AI the flavors you love, and get a custom juice recipe in seconds/)).toBeInTheDocument();
  });
});
