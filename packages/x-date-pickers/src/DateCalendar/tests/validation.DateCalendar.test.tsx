import * as React from 'react';
import { screen, waitFor } from '@mui/internal-test-utils';
import { DateCalendar, DateCalendarProps } from '@mui/x-date-pickers/DateCalendar';
import { PickerValidDate } from '@mui/x-date-pickers/models';
import { createPickerRenderer, adapterToUse } from 'test/utils/pickers';

function WrappedDateCalendar(
  props: Omit<DateCalendarProps, 'value' | 'onChange'> & { initialValue: PickerValidDate },
) {
  const { initialValue, ...other } = props;

  const [value, setValue] = React.useState<PickerValidDate | null>(initialValue);

  const handleChange = React.useCallback((newValue: PickerValidDate | null) => {
    setValue(newValue);
  }, []);

  return <DateCalendar {...other} value={value} onChange={handleChange} />;
}

describe('<DateCalendar /> - Validation', () => {
  const { render } = createPickerRenderer();

  // Test about `shouldDisableMonth` on the "month" view is on the `MonthCalendar` test file.
  describe('props.shouldDisableMonth', () => {
    it('should disable all the dates on the "day" view when `shouldDisableMonth` returns false for its month`', async () => {
      const { user } = render(
        <WrappedDateCalendar
          initialValue={adapterToUse.date('2018-06-01')}
          shouldDisableMonth={(date) => adapterToUse.getMonth(date) === 6}
          views={['day']}
          openTo={'day'}
        />,
      );

      // No date should be disabled in the month before the disabled month
      screen.getAllByTestId('day').forEach((day) => {
        expect(day).not.to.have.attribute('disabled');
      });

      await user.click(screen.getByTitle('Next month'));
      await waitFor(() => {
        screen.getAllByTestId('day').forEach((day) => {
          expect(day).to.have.attribute('disabled');
        });
      });

      await user.click(screen.getByTitle('Next month'));
      await waitFor(() => {
        screen.getAllByTestId('day').forEach((day) => {
          expect(day).not.to.have.attribute('disabled');
        });
      });
    });
  });

  // Test about `shouldDisableYear` on the "year" view is on the `YearCalendar` test file.
  describe('props.shouldDisableYear', () => {
    it('should disable all the dates on the "day" view when `shouldDisableYear` returns false for its year`', async () => {
      const { user } = render(
        <WrappedDateCalendar
          initialValue={adapterToUse.date('2017-12-01')}
          shouldDisableYear={(date) => adapterToUse.getYear(date) === 2018}
          views={['day']}
          openTo={'day'}
        />,
      );

      // No date should be disabled in the month before the disabled year
      screen.getAllByTestId('day').forEach((day) => {
        expect(day).not.to.have.attribute('disabled');
      });

      await user.click(screen.getByTitle('Next month'));
      await waitFor(() => {
        screen.getAllByTestId('day').forEach((day) => {
          expect(day).to.have.attribute('disabled');
        });
      });
    });
  });
});
